import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  ReactNode,
} from 'react';
import { api, getToken, setToken } from './api';
import type { Goal, MeResponse, Summary, User } from './types';

interface Store {
  ready: boolean;
  me: MeResponse | null;
  goals: Goal[];
  wsConnected: boolean;
  register: (email: string, name: string, password: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshMe: () => Promise<MeResponse | null>;
  refreshGoals: () => Promise<void>;
  createCouple: () => Promise<string>;
  joinCouple: (code: string) => Promise<void>;
  leaveCouple: () => Promise<void>;
  addGoal: (g: Partial<Goal>) => Promise<Goal>;
  editGoal: (id: string, g: Partial<Goal>) => Promise<void>;
  deleteGoal: (id: string) => Promise<void>;
  setProgress: (id: string, delta: number) => Promise<boolean>;
  completeGoal: (id: string) => Promise<boolean>;
  uncompleteGoal: (id: string) => Promise<void>;
  updateSettings: (s: Partial<User>) => Promise<void>;
  getSummary: () => Promise<Summary>;
}

const Ctx = createContext<Store | null>(null);
export const useStore = () => {
  const c = useContext(Ctx);
  if (!c) throw new Error('useStore outside provider');
  return c;
};

// Cached session + goals so the app stays signed in and shows instantly on
// reopen — even offline or while a sleeping server wakes up.
const ME_KEY = 'dainty_me';
const GOALS_KEY = 'dainty_goals';
function loadCache<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}
function saveCache(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}
function clearCache() {
  try {
    localStorage.removeItem(ME_KEY);
    localStorage.removeItem(GOALS_KEY);
  } catch {}
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [me, setMe] = useState<MeResponse | null>(null);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [wsConnected, setWsConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectRef = useRef<ReturnType<typeof setTimeout>>();

  const refreshMe = useCallback(async () => {
    const data = await api.get<MeResponse>('/me');
    if (data.token) setToken(data.token); // slide the session so it never expires with daily use
    setMe(data);
    saveCache(ME_KEY, data);
    return data;
  }, []);

  const refreshGoals = useCallback(async () => {
    const data = await api.get<{ goals: Goal[] }>('/goals');
    setGoals(data.goals);
    saveCache(GOALS_KEY, data.goals);
  }, []);

  // ---- realtime ----
  const connectWs = useCallback(() => {
    const token = getToken();
    if (!token) return;
    if (wsRef.current && wsRef.current.readyState <= 1) return;
    const proto = location.protocol === 'https:' ? 'wss' : 'ws';
    const ws = new WebSocket(`${proto}://${location.host}/ws?token=${token}`);
    wsRef.current = ws;
    ws.onopen = () => setWsConnected(true);
    ws.onmessage = (ev) => {
      try {
        const msg = JSON.parse(ev.data);
        if (msg.type === 'goals_changed' && Array.isArray(msg.goals)) {
          setGoals(msg.goals);
        } else if (
          msg.type === 'partner_joined' ||
          msg.type === 'partner_left' ||
          msg.type === 'partner_updated'
        ) {
          refreshMe();
          refreshGoals();
        }
      } catch {}
    };
    ws.onclose = () => {
      setWsConnected(false);
      wsRef.current = null;
      if (getToken()) {
        clearTimeout(reconnectRef.current);
        reconnectRef.current = setTimeout(connectWs, 2500);
      }
    };
    ws.onerror = () => ws.close();
  }, [refreshMe, refreshGoals]);

  const disconnectWs = useCallback(() => {
    clearTimeout(reconnectRef.current);
    if (wsRef.current) {
      wsRef.current.onclose = null;
      wsRef.current.close();
      wsRef.current = null;
    }
    setWsConnected(false);
  }, []);

  // ---- bootstrap ----
  useEffect(() => {
    const doLogout = () => {
      disconnectWs();
      setToken(null);
      clearCache();
      setMe(null);
      setGoals([]);
    };
    const onUnauthorized = () => doLogout();
    window.addEventListener('dainty:unauthorized', onUnauthorized);

    (async () => {
      if (getToken()) {
        // Restore the last saved session immediately so you're not bounced to
        // the login screen while the server is waking up or you're offline.
        const cachedMe = loadCache<MeResponse>(ME_KEY);
        if (cachedMe) {
          setMe(cachedMe);
          const cachedGoals = loadCache<Goal[]>(GOALS_KEY);
          if (cachedGoals) setGoals(cachedGoals);
          if (cachedMe.partner) connectWs();
        }
        try {
          const data = await refreshMe();
          if (data.couple) {
            await refreshGoals();
            connectWs();
          }
        } catch (e: any) {
          // Only sign out when the token is genuinely invalid (401). A network
          // error or a sleeping free-tier server must keep you logged in.
          if (e?.status === 401) doLogout();
        }
      }
      setReady(true);
    })();

    return () => {
      window.removeEventListener('dainty:unauthorized', onUnauthorized);
      disconnectWs();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const afterAuth = useCallback(
    async (token: string, user: User) => {
      setToken(token);
      const data = await refreshMe();
      if (data.couple) {
        await refreshGoals();
        connectWs();
      }
      return data;
    },
    [refreshMe, refreshGoals, connectWs]
  );

  const register = useCallback(
    async (email: string, name: string, password: string) => {
      const r = await api.post<{ token: string; user: User }>('/register', {
        email,
        name,
        password,
      });
      await afterAuth(r.token, r.user);
    },
    [afterAuth]
  );

  const login = useCallback(
    async (email: string, password: string) => {
      const r = await api.post<{ token: string; user: User }>('/login', { email, password });
      await afterAuth(r.token, r.user);
    },
    [afterAuth]
  );

  const logout = useCallback(() => {
    disconnectWs();
    setToken(null);
    clearCache();
    setMe(null);
    setGoals([]);
  }, [disconnectWs]);

  const createCouple = useCallback(async () => {
    const r = await api.post<{ inviteCode: string }>('/couple/create', {});
    await refreshMe();
    return r.inviteCode;
  }, [refreshMe]);

  const joinCouple = useCallback(
    async (code: string) => {
      await api.post('/couple/join', { code });
      await refreshMe();
      await refreshGoals();
      connectWs();
    },
    [refreshMe, refreshGoals, connectWs]
  );

  const leaveCouple = useCallback(async () => {
    await api.post('/couple/leave', {});
    disconnectWs();
    await refreshMe();
    setGoals([]);
  }, [refreshMe, disconnectWs]);

  const addGoal = useCallback(async (g: Partial<Goal>) => {
    const r = await api.post<{ goal: Goal }>('/goals', g);
    await refreshGoals();
    return r.goal;
  }, [refreshGoals]);

  const editGoal = useCallback(async (id: string, g: Partial<Goal>) => {
    await api.put(`/goals/${id}`, g);
    await refreshGoals();
  }, [refreshGoals]);

  const deleteGoal = useCallback(async (id: string) => {
    await api.del(`/goals/${id}`);
    await refreshGoals();
  }, [refreshGoals]);

  const setProgress = useCallback(async (id: string, delta: number) => {
    const r = await api.post<{ goal: Goal; justCompleted: boolean }>(`/goals/${id}/progress`, {
      delta,
    });
    await refreshGoals();
    return r.justCompleted;
  }, [refreshGoals]);

  const completeGoal = useCallback(async (id: string) => {
    const r = await api.post<{ justCompleted: boolean }>(`/goals/${id}/complete`, {});
    await refreshGoals();
    return r.justCompleted;
  }, [refreshGoals]);

  const uncompleteGoal = useCallback(async (id: string) => {
    await api.post(`/goals/${id}/uncomplete`, {});
    await refreshGoals();
  }, [refreshGoals]);

  const updateSettings = useCallback(async (s: Partial<User>) => {
    await api.put('/settings', {
      name: s.name,
      remindersEnabled: s.remindersEnabled,
      reminderTime: s.reminderTime,
    });
    await refreshMe();
  }, [refreshMe]);

  const getSummary = useCallback(() => api.get<Summary>('/summary'), []);

  const value: Store = {
    ready,
    me,
    goals,
    wsConnected,
    register,
    login,
    logout,
    refreshMe,
    refreshGoals,
    createCouple,
    joinCouple,
    leaveCouple,
    addGoal,
    editGoal,
    deleteGoal,
    setProgress,
    completeGoal,
    uncompleteGoal,
    updateSettings,
    getSummary,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
