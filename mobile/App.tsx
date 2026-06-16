import { Ionicons } from '@expo/vector-icons';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { StatusBar } from 'expo-status-bar';
import {
  FirebaseApp,
  FirebaseError,
  getApp,
  getApps,
  initializeApp,
} from 'firebase/app';
import {
  Auth,
  User,
  createUserWithEmailAndPassword,
  getAuth,
  initializeAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import {
  Timestamp,
  addDoc,
  collection,
  deleteDoc,
  doc,
  documentId,
  getDocs,
  getFirestore,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import dayjs from 'dayjs';
import isoWeek from 'dayjs/plugin/isoWeek';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  FlatList,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  Share,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

dayjs.extend(isoWeek);

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

const palette = {
  blush: '#f8dce7',
  cream: '#fffaf2',
  lavender: '#e8def8',
  sage: '#dceadf',
  plum: '#5f4b66',
  rose: '#d26b99',
  mint: '#77a487',
  white: '#ffffff',
  gray: '#8b8290',
  border: '#eadce5',
};

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY ?? '',
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN ?? '',
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID ?? '',
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET ?? '',
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? '',
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID ?? '',
};

type GoalFrequency = 'daily' | 'weekly';

type Goal = {
  id: string;
  title: string;
  notes: string;
  frequency: GoalFrequency;
  progressCurrent: number;
  progressTarget: number;
  completed: boolean;
  createdBy: string;
  completedBy?: string;
  createdAt?: Timestamp;
  completedAt?: Timestamp;
  weekKey: string;
};

type UserProfile = {
  id: string;
  displayName: string;
  email: string;
  coupleId?: string;
  streakCount?: number;
  lastDailyCompletionDate?: string;
  reminderEnabled?: boolean;
  reminderHour?: number;
  reminderMinute?: number;
  pushToken?: string;
};

type RootStackParamList = {
  MainTabs: undefined;
  AddGoal: { defaultFrequency: GoalFrequency } | undefined;
  GoalDetails: { goalId: string };
  Celebration: { goalTitle: string; byName: string };
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator();

function isFirebaseConfigured() {
  return Boolean(
    firebaseConfig.apiKey &&
      firebaseConfig.projectId &&
      firebaseConfig.appId &&
      firebaseConfig.authDomain
  );
}

function getWeekKey(date = dayjs()) {
  return `${date.year()}-W${date.isoWeek()}`;
}

function getFirebaseBundle(): { app: FirebaseApp; auth: Auth } {
  const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
  let auth: Auth;
  try {
    auth = initializeAuth(app);
  } catch {
    auth = getAuth(app);
  }
  return { app, auth };
}

function AppShell() {
  const firebaseReady = isFirebaseConfigured();
  const { app, auth } = useMemo(() => {
    if (!firebaseReady) {
      return { app: undefined, auth: undefined };
    }
    return getFirebaseBundle();
  }, [firebaseReady]);

  const db = useMemo(() => (app ? getFirestore(app) : undefined), [app]);
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [inviteCode, setInviteCode] = useState('');
  const [members, setMembers] = useState<Record<string, string>>({});
  const [goals, setGoals] = useState<Goal[]>([]);

  useEffect(() => {
    if (!auth) {
      return;
    }
    const unsubscribe = onAuthStateChanged(auth, (nextUser) => {
      setAuthUser(nextUser);
      setAuthReady(true);
    });
    return unsubscribe;
  }, [auth]);

  useEffect(() => {
    if (!db || !authUser) {
      setProfile(null);
      return;
    }
    const profileRef = doc(db, 'users', authUser.uid);
    const unsubscribe = onSnapshot(profileRef, async (snapshot) => {
      if (!snapshot.exists()) {
        const seededProfile = {
          displayName:
            authUser.displayName ?? authUser.email?.split('@')[0] ?? 'Sweetheart',
          email: authUser.email ?? '',
          coupleId: '',
          reminderEnabled: false,
          reminderHour: 20,
          reminderMinute: 30,
          streakCount: 0,
          lastDailyCompletionDate: '',
        };
        await setDoc(profileRef, seededProfile);
        return;
      }
      const data = snapshot.data() as Omit<UserProfile, 'id'>;
      setProfile({ id: snapshot.id, ...data });
    });
    return unsubscribe;
  }, [db, authUser]);

  useEffect(() => {
    if (!db || !profile?.coupleId) {
      setInviteCode('');
      return;
    }
    const coupleRef = doc(db, 'couples', profile.coupleId);
    const unsubscribe = onSnapshot(coupleRef, (snapshot) => {
      const data = snapshot.data();
      setInviteCode((data?.inviteCode as string | undefined) ?? '');
    });
    return unsubscribe;
  }, [db, profile?.coupleId]);

  useEffect(() => {
    if (!db || !profile?.coupleId) {
      setMembers({});
      return;
    }
    const coupleRef = doc(db, 'couples', profile.coupleId);
    const unsubscribeCouple = onSnapshot(coupleRef, async (snapshot) => {
      if (!snapshot.exists()) {
        return;
      }
      const userIds = (snapshot.data().members as string[] | undefined) ?? [];
      if (userIds.length === 0) {
        return;
      }
      const usersQuery = query(
        collection(db, 'users'),
        where(documentId(), 'in', userIds.slice(0, 10))
      );
      const usersSnapshot = await getDocs(usersQuery);
      const map: Record<string, string> = {};
      usersSnapshot.forEach((userDoc) => {
        const data = userDoc.data() as Omit<UserProfile, 'id'>;
        map[userDoc.id] = data.displayName;
      });
      setMembers(map);
    });
    return unsubscribeCouple;
  }, [db, profile?.coupleId]);

  useEffect(() => {
    if (!db || !profile?.coupleId) {
      setGoals([]);
      return;
    }
    const goalsRef = collection(db, 'couples', profile.coupleId, 'goals');
    const goalsQuery = query(goalsRef, orderBy('createdAt', 'desc'), limit(200));
    const unsubscribe = onSnapshot(goalsQuery, (snapshot) => {
      const nextGoals: Goal[] = snapshot.docs.map((goalDoc) => {
        const data = goalDoc.data() as Omit<Goal, 'id'>;
        return { id: goalDoc.id, ...data };
      });
      setGoals(nextGoals);
    });
    return unsubscribe;
  }, [db, profile?.coupleId]);

  useEffect(() => {
    const syncPushToken = async () => {
      if (!db || !profile || !authUser || !Device.isDevice) {
        return;
      }
      try {
        const permissions = await Notifications.getPermissionsAsync();
        let finalStatus = permissions.status;
        if (finalStatus !== 'granted') {
          const request = await Notifications.requestPermissionsAsync();
          finalStatus = request.status;
        }
        if (finalStatus !== 'granted') {
          return;
        }
        const tokenResult = await Notifications.getExpoPushTokenAsync();
        const token = tokenResult.data;
        if (token && token !== profile.pushToken) {
          await updateDoc(doc(db, 'users', authUser.uid), {
            pushToken: token,
            updatedAt: serverTimestamp(),
          });
        }
      } catch {
        // No-op: push token is optional in local development.
      }
    };
    syncPushToken().catch(() => undefined);
  }, [db, profile, authUser]);

  const scheduleReminderIfNeeded = async (nextProfile: UserProfile) => {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      if (!nextProfile.reminderEnabled) {
        return;
      }
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Dainty Goals',
          body: 'Check in with your love and complete today’s goals 💕',
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour: nextProfile.reminderHour ?? 20,
          minute: nextProfile.reminderMinute ?? 30,
        },
      });
    } catch {
      // Keep app usable if local scheduling fails on unsupported environments.
    }
  };

  const updateReminderPrefs = async (updates: Partial<UserProfile>) => {
    if (!db || !profile || !authUser) {
      return;
    }
    const nextProfile = { ...profile, ...updates };
    await updateDoc(doc(db, 'users', authUser.uid), {
      reminderEnabled: nextProfile.reminderEnabled ?? false,
      reminderHour: nextProfile.reminderHour ?? 20,
      reminderMinute: nextProfile.reminderMinute ?? 30,
      updatedAt: serverTimestamp(),
    });
    await scheduleReminderIfNeeded(nextProfile);
  };

  const pairWithCode = async (code: string) => {
    if (!db || !profile || !authUser) {
      return;
    }
    const cleaned = code.trim().toUpperCase();
    if (!cleaned) {
      Alert.alert('Missing code', 'Please enter your partner’s invite code.');
      return;
    }
    const couplesQuery = query(
      collection(db, 'couples'),
      where('inviteCode', '==', cleaned),
      limit(1)
    );
    const coupleSnapshot = await getDocs(couplesQuery);
    if (coupleSnapshot.empty) {
      Alert.alert('Not found', 'That invite code does not exist yet.');
      return;
    }
    const matched = coupleSnapshot.docs[0];
    const data = matched.data() as { members?: string[] };
    const membersInCouple = data.members ?? [];
    if (!membersInCouple.includes(authUser.uid) && membersInCouple.length >= 2) {
      Alert.alert('Pair full', 'This pair already has two partners.');
      return;
    }
    const mergedMembers = Array.from(new Set([...membersInCouple, authUser.uid]));
    await updateDoc(matched.ref, {
      members: mergedMembers,
      updatedAt: serverTimestamp(),
    });
    await updateDoc(doc(db, 'users', authUser.uid), {
      coupleId: matched.id,
      updatedAt: serverTimestamp(),
    });
  };

  const createPair = async () => {
    if (!db || !profile || !authUser) {
      return;
    }
    const newCode = Math.random().toString(36).slice(2, 8).toUpperCase();
    const newCouple = await addDoc(collection(db, 'couples'), {
      inviteCode: newCode,
      members: [authUser.uid],
      createdBy: authUser.uid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    await updateDoc(doc(db, 'users', authUser.uid), {
      coupleId: newCouple.id,
      updatedAt: serverTimestamp(),
    });
  };

  const addGoal = async (goal: {
    title: string;
    notes: string;
    frequency: GoalFrequency;
    target: number;
  }) => {
    if (!db || !profile?.coupleId || !authUser) {
      return;
    }
    await addDoc(collection(db, 'couples', profile.coupleId, 'goals'), {
      title: goal.title.trim(),
      notes: goal.notes.trim(),
      frequency: goal.frequency,
      progressCurrent: 0,
      progressTarget: Math.max(1, goal.target),
      completed: false,
      createdBy: authUser.uid,
      completedBy: '',
      weekKey: getWeekKey(),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  };

  const updateGoal = async (
    goalId: string,
    updates: Partial<{
      title: string;
      notes: string;
      progressCurrent: number;
      progressTarget: number;
      completed: boolean;
      completedBy: string;
      completedAt: Timestamp | null;
      frequency: GoalFrequency;
    }>
  ) => {
    if (!db || !profile?.coupleId) {
      return;
    }
    const payload = {
      ...updates,
      updatedAt: serverTimestamp(),
    };
    await updateDoc(doc(db, 'couples', profile.coupleId, 'goals', goalId), payload);
  };

  const deleteGoal = async (goalId: string) => {
    if (!db || !profile?.coupleId) {
      return;
    }
    await deleteDoc(doc(db, 'couples', profile.coupleId, 'goals', goalId));
  };

  const updateStreakAfterDailyCompletion = async () => {
    if (!db || !profile || !authUser) {
      return;
    }
    const today = dayjs().format('YYYY-MM-DD');
    const lastDate = profile.lastDailyCompletionDate
      ? dayjs(profile.lastDailyCompletionDate)
      : null;
    const yesterday = dayjs().subtract(1, 'day').format('YYYY-MM-DD');
    const nextCount =
      profile.lastDailyCompletionDate === today
        ? profile.streakCount ?? 0
        : profile.lastDailyCompletionDate === yesterday || lastDate?.isSame(dayjs().subtract(1, 'day'), 'day')
          ? (profile.streakCount ?? 0) + 1
          : 1;
    await updateDoc(doc(db, 'users', authUser.uid), {
      streakCount: nextCount,
      lastDailyCompletionDate: today,
      updatedAt: serverTimestamp(),
    });
  };

  const markComplete = async (goal: Goal) => {
    if (!authUser) {
      return;
    }
    const nextCompleted = !goal.completed;
    await updateGoal(goal.id, {
      completed: nextCompleted,
      completedBy: nextCompleted ? authUser.uid : '',
      completedAt: nextCompleted ? Timestamp.now() : null,
      progressCurrent: nextCompleted ? goal.progressTarget : goal.progressCurrent,
    });
    if (nextCompleted && goal.frequency === 'daily') {
      await updateStreakAfterDailyCompletion();
    }
  };

  if (!firebaseReady) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.card}>
          <Text style={styles.h1}>Dainty Goals</Text>
          <Text style={styles.subtitle}>
            Add Firebase keys in `.env` to run secure auth + cloud sync.
          </Text>
          <Text style={styles.mono}>
            EXPO_PUBLIC_FIREBASE_API_KEY={"\n"}
            EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN={"\n"}
            EXPO_PUBLIC_FIREBASE_PROJECT_ID={"\n"}
            EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET={"\n"}
            EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID={"\n"}
            EXPO_PUBLIC_FIREBASE_APP_ID
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!authReady || !db || !auth) {
    return (
      <SafeAreaView style={styles.safeAreaCentered}>
        <Text style={styles.subtitle}>Warming up your shared space...</Text>
      </SafeAreaView>
    );
  }

  if (!authUser) {
    return <AuthScreen auth={auth} db={db} />;
  }

  if (!profile?.coupleId) {
    return (
      <PairingScreen
        onCreatePair={createPair}
        onPairWithCode={pairWithCode}
        userName={profile?.displayName ?? authUser.email ?? 'Sweetheart'}
      />
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerStyle: { backgroundColor: palette.cream } }}>
        <Stack.Screen
          name="MainTabs"
          options={{ headerShown: false }}
        >
          {() => (
            <MainTabs
              goals={goals}
              members={members}
              inviteCode={inviteCode}
              profile={profile}
              onSignOut={() => signOut(auth)}
              onToggleComplete={markComplete}
              onUpdateGoal={updateGoal}
              onDeleteGoal={deleteGoal}
              onUpdateReminderPrefs={updateReminderPrefs}
            />
          )}
        </Stack.Screen>
        <Stack.Screen
          name="AddGoal"
          options={{ title: 'Add Goal' }}
        >
          {(props) => (
            <AddGoalScreen
              defaultFrequency={props.route.params?.defaultFrequency ?? 'daily'}
              onAddGoal={addGoal}
              navigation={props.navigation}
            />
          )}
        </Stack.Screen>
        <Stack.Screen name="GoalDetails" options={{ title: 'Goal Details' }}>
          {(props) => (
            <GoalDetailsScreen
              goal={goals.find((goal) => goal.id === props.route.params.goalId)}
              members={members}
              onUpdateGoal={updateGoal}
              onDeleteGoal={deleteGoal}
              onToggleComplete={markComplete}
              navigation={props.navigation}
            />
          )}
        </Stack.Screen>
        <Stack.Screen
          name="Celebration"
          options={{ title: 'Celebration' }}
          component={CelebrationScreen}
        />
      </Stack.Navigator>
      <StatusBar style="dark" />
    </NavigationContainer>
  );
}

function AuthScreen({ auth, db }: { auth: Auth; db: ReturnType<typeof getFirestore> }) {
  const [mode, setMode] = useState<'signin' | 'signup'>('signup');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!email.trim() || password.length < 6) {
      Alert.alert('Check details', 'Use a valid email and at least 6 password characters.');
      return;
    }
    setLoading(true);
    try {
      if (mode === 'signup') {
        const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
        await setDoc(doc(db, 'users', cred.user.uid), {
          displayName: displayName.trim() || email.split('@')[0],
          email: email.trim(),
          coupleId: '',
          reminderEnabled: false,
          reminderHour: 20,
          reminderMinute: 30,
          streakCount: 0,
          lastDailyCompletionDate: '',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      } else {
        await signInWithEmailAndPassword(auth, email.trim(), password);
      }
    } catch (error) {
      const err = error as FirebaseError;
      Alert.alert('Auth issue', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.authContainer}>
        <Text style={styles.h1}>Dainty Goals</Text>
        <Text style={styles.subtitle}>Set soft little goals together, every day.</Text>
        <View style={styles.card}>
          {mode === 'signup' ? (
            <TextInput
              placeholder="Your name"
              placeholderTextColor={palette.gray}
              style={styles.input}
              value={displayName}
              onChangeText={setDisplayName}
            />
          ) : null}
          <TextInput
            placeholder="Email"
            placeholderTextColor={palette.gray}
            style={styles.input}
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />
          <TextInput
            placeholder="Password"
            placeholderTextColor={palette.gray}
            style={styles.input}
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />
          <Pressable style={styles.primaryButton} disabled={loading} onPress={submit}>
            <Text style={styles.primaryButtonText}>
              {loading ? 'Please wait...' : mode === 'signup' ? 'Create account' : 'Sign in'}
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setMode((prev) => (prev === 'signup' ? 'signin' : 'signup'))}
            style={styles.secondaryButton}
          >
            <Text style={styles.secondaryButtonText}>
              {mode === 'signup' ? 'Already have an account? Sign in' : 'Need an account? Sign up'}
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function PairingScreen({
  onCreatePair,
  onPairWithCode,
  userName,
}: {
  onCreatePair: () => Promise<void>;
  onPairWithCode: (code: string) => Promise<void>;
  userName: string;
}) {
  const [inviteInput, setInviteInput] = useState('');
  const [loading, setLoading] = useState(false);

  const create = async () => {
    setLoading(true);
    await onCreatePair().catch((error: Error) => Alert.alert('Could not create pair', error.message));
    setLoading(false);
  };

  const join = async () => {
    setLoading(true);
    await onPairWithCode(inviteInput).catch((error: Error) =>
      Alert.alert('Could not join pair', error.message)
    );
    setLoading(false);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={[styles.card, { marginTop: 40 }]}>
        <Text style={styles.h2}>Hi {userName} 💗</Text>
        <Text style={styles.subtitle}>
          Pair your account with your partner by invite code or create one now.
        </Text>
        <Pressable style={styles.primaryButton} onPress={create} disabled={loading}>
          <Text style={styles.primaryButtonText}>
            {loading ? 'Working...' : 'Create our couple space'}
          </Text>
        </Pressable>
        <TextInput
          placeholder="Enter partner invite code"
          placeholderTextColor={palette.gray}
          style={styles.input}
          value={inviteInput}
          onChangeText={(text) => setInviteInput(text.toUpperCase())}
          autoCapitalize="characters"
          maxLength={6}
        />
        <Pressable style={styles.secondaryButton} onPress={join} disabled={loading}>
          <Text style={styles.secondaryButtonText}>Join with code</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

function MainTabs({
  goals,
  members,
  inviteCode,
  profile,
  onSignOut,
  onToggleComplete,
  onUpdateGoal,
  onDeleteGoal,
  onUpdateReminderPrefs,
}: {
  goals: Goal[];
  members: Record<string, string>;
  inviteCode: string;
  profile: UserProfile;
  onSignOut: () => Promise<void>;
  onToggleComplete: (goal: Goal) => Promise<void>;
  onUpdateGoal: (goalId: string, updates: Record<string, unknown>) => Promise<void>;
  onDeleteGoal: (goalId: string) => Promise<void>;
  onUpdateReminderPrefs: (updates: Partial<UserProfile>) => Promise<void>;
}) {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerStyle: { backgroundColor: palette.cream },
        headerTitleStyle: { color: palette.plum },
        tabBarActiveTintColor: palette.rose,
        tabBarInactiveTintColor: palette.gray,
        tabBarStyle: { backgroundColor: palette.white },
        tabBarIcon: ({ color, size }) => {
          const map: Record<string, keyof typeof Ionicons.glyphMap> = {
            Today: 'heart-outline',
            Weekly: 'calendar-outline',
            Settings: 'sparkles-outline',
          };
          return <Ionicons name={map[route.name] ?? 'ellipse-outline'} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Today">
        {(props) => (
          <HomeScreen
            {...props}
            goals={goals}
            members={members}
            streak={profile.streakCount ?? 0}
            inviteCode={inviteCode}
            onToggleComplete={onToggleComplete}
          />
        )}
      </Tab.Screen>
      <Tab.Screen name="Weekly">
        {(props) => (
          <WeeklyScreen
            {...props}
            goals={goals}
            members={members}
            onToggleComplete={onToggleComplete}
            onUpdateGoal={onUpdateGoal}
            onDeleteGoal={onDeleteGoal}
          />
        )}
      </Tab.Screen>
      <Tab.Screen name="Settings">
        {(props) => (
          <SettingsScreen
            {...props}
            profile={profile}
            inviteCode={inviteCode}
            onSignOut={onSignOut}
            onUpdateReminderPrefs={onUpdateReminderPrefs}
          />
        )}
      </Tab.Screen>
    </Tab.Navigator>
  );
}

function GoalCard({
  goal,
  members,
  onOpen,
  onToggleComplete,
}: {
  goal: Goal;
  members: Record<string, string>;
  onOpen: () => void;
  onToggleComplete: () => void;
}) {
  const progress = Math.max(0, Math.min(1, goal.progressCurrent / Math.max(goal.progressTarget, 1)));
  return (
    <Pressable style={styles.goalCard} onPress={onOpen}>
      <View style={styles.goalHeaderRow}>
        <Text style={styles.goalTitle}>{goal.title}</Text>
        <Pressable onPress={onToggleComplete} style={styles.checkButton}>
          <Ionicons
            name={goal.completed ? 'checkmark-circle' : 'ellipse-outline'}
            size={28}
            color={goal.completed ? palette.mint : palette.gray}
          />
        </Pressable>
      </View>
      <Text style={styles.metaText}>Created by {members[goal.createdBy] ?? 'Partner'}</Text>
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
      </View>
      <Text style={styles.metaText}>
        Progress {goal.progressCurrent}/{goal.progressTarget}
      </Text>
      {goal.completed ? (
        <Text style={styles.completedText}>
          Completed by {members[goal.completedBy ?? ''] ?? 'Partner'} ✅
        </Text>
      ) : null}
    </Pressable>
  );
}

function HomeScreen({
  navigation,
  goals,
  members,
  streak,
  inviteCode,
  onToggleComplete,
}: {
  navigation: any;
  goals: Goal[];
  members: Record<string, string>;
  streak: number;
  inviteCode: string;
  onToggleComplete: (goal: Goal) => Promise<void>;
}) {
  const todayDailyGoals = goals.filter((goal) => goal.frequency === 'daily');

  return (
    <SafeAreaView style={styles.safeArea}>
      <FlatList
        ListHeaderComponent={
          <View>
            <View style={styles.card}>
              <Text style={styles.h2}>Today’s shared goals</Text>
              <Text style={styles.subtitle}>Invite code: {inviteCode || 'Generating...'}</Text>
              <Text style={styles.subtitle}>Daily streak: {streak} day(s) 🔥</Text>
            </View>
            <Pressable
              style={[styles.primaryButton, { marginBottom: 12 }]}
              onPress={() => navigation.navigate('AddGoal', { defaultFrequency: 'daily' })}
            >
              <Text style={styles.primaryButtonText}>+ Add daily goal</Text>
            </Pressable>
          </View>
        }
        data={todayDailyGoals}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <GoalCard
            goal={item}
            members={members}
            onOpen={() => navigation.navigate('GoalDetails', { goalId: item.id })}
            onToggleComplete={async () => {
              await onToggleComplete(item);
              if (!item.completed) {
                navigation.navigate('Celebration', {
                  goalTitle: item.title,
                  byName: members[item.createdBy] ?? 'your partner',
                });
              }
            }}
          />
        )}
        ListEmptyComponent={<Text style={styles.subtitle}>No daily goals yet. Add one with love.</Text>}
        contentContainerStyle={styles.listPad}
      />
    </SafeAreaView>
  );
}

function WeeklyScreen({
  navigation,
  goals,
  members,
  onToggleComplete,
}: {
  navigation: any;
  goals: Goal[];
  members: Record<string, string>;
  onToggleComplete: (goal: Goal) => Promise<void>;
  onUpdateGoal: (goalId: string, updates: Record<string, unknown>) => Promise<void>;
  onDeleteGoal: (goalId: string) => Promise<void>;
}) {
  const weeklyGoals = goals.filter(
    (goal) => goal.frequency === 'weekly' && goal.weekKey === getWeekKey()
  );
  const completed = weeklyGoals.filter((goal) => goal.completed).length;
  const unfinished = weeklyGoals.length - completed;

  return (
    <SafeAreaView style={styles.safeArea}>
      <FlatList
        ListHeaderComponent={
          <View>
            <View style={styles.card}>
              <Text style={styles.h2}>This week</Text>
              <Text style={styles.subtitle}>
                Summary: {completed} completed · {unfinished} unfinished
              </Text>
            </View>
            <Pressable
              style={[styles.primaryButton, { marginBottom: 12 }]}
              onPress={() => navigation.navigate('AddGoal', { defaultFrequency: 'weekly' })}
            >
              <Text style={styles.primaryButtonText}>+ Add weekly goal</Text>
            </Pressable>
          </View>
        }
        data={weeklyGoals}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <GoalCard
            goal={item}
            members={members}
            onOpen={() => navigation.navigate('GoalDetails', { goalId: item.id })}
            onToggleComplete={() => onToggleComplete(item)}
          />
        )}
        ListEmptyComponent={<Text style={styles.subtitle}>No weekly goals yet for this week.</Text>}
        contentContainerStyle={styles.listPad}
      />
    </SafeAreaView>
  );
}

function AddGoalScreen({
  navigation,
  defaultFrequency,
  onAddGoal,
}: {
  navigation: any;
  defaultFrequency: GoalFrequency;
  onAddGoal: (goal: {
    title: string;
    notes: string;
    frequency: GoalFrequency;
    target: number;
  }) => Promise<void>;
}) {
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [frequency, setFrequency] = useState<GoalFrequency>(defaultFrequency);
  const [target, setTarget] = useState('1');

  const submit = async () => {
    if (!title.trim()) {
      Alert.alert('Add title', 'Every goal needs a title.');
      return;
    }
    await onAddGoal({
      title,
      notes,
      frequency,
      target: Number.parseInt(target || '1', 10),
    });
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.card}>
        <Text style={styles.h2}>Create a goal</Text>
        <TextInput
          placeholder="Goal title"
          placeholderTextColor={palette.gray}
          style={styles.input}
          value={title}
          onChangeText={setTitle}
        />
        <TextInput
          placeholder="Notes"
          placeholderTextColor={palette.gray}
          style={[styles.input, styles.textArea]}
          multiline
          value={notes}
          onChangeText={setNotes}
        />
        <View style={styles.row}>
          <Pressable
            style={[styles.frequencyButton, frequency === 'daily' && styles.frequencySelected]}
            onPress={() => setFrequency('daily')}
          >
            <Text style={styles.secondaryButtonText}>Daily</Text>
          </Pressable>
          <Pressable
            style={[styles.frequencyButton, frequency === 'weekly' && styles.frequencySelected]}
            onPress={() => setFrequency('weekly')}
          >
            <Text style={styles.secondaryButtonText}>Weekly</Text>
          </Pressable>
        </View>
        <TextInput
          placeholder="Progress target (e.g. 3)"
          placeholderTextColor={palette.gray}
          keyboardType="numeric"
          style={styles.input}
          value={target}
          onChangeText={setTarget}
        />
        <Pressable style={styles.primaryButton} onPress={submit}>
          <Text style={styles.primaryButtonText}>Save goal</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

function GoalDetailsScreen({
  goal,
  members,
  onUpdateGoal,
  onDeleteGoal,
  onToggleComplete,
  navigation,
}: {
  goal?: Goal;
  members: Record<string, string>;
  onUpdateGoal: (
    goalId: string,
    updates: Partial<{
      title: string;
      notes: string;
      progressCurrent: number;
      progressTarget: number;
      completed: boolean;
      completedBy: string;
      completedAt: Timestamp | null;
      frequency: GoalFrequency;
    }>
  ) => Promise<void>;
  onDeleteGoal: (goalId: string) => Promise<void>;
  onToggleComplete: (goal: Goal) => Promise<void>;
  navigation: any;
}) {
  const [draftTitle, setDraftTitle] = useState(goal?.title ?? '');
  const [draftNotes, setDraftNotes] = useState(goal?.notes ?? '');
  const [progressCurrent, setProgressCurrent] = useState(String(goal?.progressCurrent ?? 0));
  const [progressTarget, setProgressTarget] = useState(String(goal?.progressTarget ?? 1));

  if (!goal) {
    return (
      <SafeAreaView style={styles.safeAreaCentered}>
        <Text style={styles.subtitle}>Goal not found.</Text>
      </SafeAreaView>
    );
  }

  const save = async () => {
    await onUpdateGoal(goal.id, {
      title: draftTitle.trim(),
      notes: draftNotes.trim(),
      progressCurrent: Number.parseInt(progressCurrent || '0', 10),
      progressTarget: Math.max(1, Number.parseInt(progressTarget || '1', 10)),
    });
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.card}>
        <Text style={styles.h2}>Goal details</Text>
        <Text style={styles.metaText}>Created by {members[goal.createdBy] ?? 'Partner'}</Text>
        <TextInput style={styles.input} value={draftTitle} onChangeText={setDraftTitle} />
        <TextInput
          style={[styles.input, styles.textArea]}
          multiline
          value={draftNotes}
          onChangeText={setDraftNotes}
        />
        <View style={styles.row}>
          <TextInput
            style={[styles.input, styles.halfInput]}
            keyboardType="numeric"
            value={progressCurrent}
            onChangeText={setProgressCurrent}
          />
          <TextInput
            style={[styles.input, styles.halfInput]}
            keyboardType="numeric"
            value={progressTarget}
            onChangeText={setProgressTarget}
          />
        </View>
        <Pressable style={styles.primaryButton} onPress={save}>
          <Text style={styles.primaryButtonText}>Save updates</Text>
        </Pressable>
        <Pressable style={styles.secondaryButton} onPress={() => onToggleComplete(goal)}>
          <Text style={styles.secondaryButtonText}>
            {goal.completed ? 'Mark as active' : 'Mark complete'}
          </Text>
        </Pressable>
        <Pressable
          style={[styles.secondaryButton, { borderColor: '#d77d9f' }]}
          onPress={() =>
            Alert.alert('Delete goal?', 'This cannot be undone.', [
              { text: 'Cancel' },
              {
                text: 'Delete',
                style: 'destructive',
                onPress: async () => {
                  await onDeleteGoal(goal.id);
                  navigation.goBack();
                },
              },
            ])
          }
        >
          <Text style={[styles.secondaryButtonText, { color: '#c05884' }]}>Delete goal</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

function CelebrationScreen({ route, navigation }: { route: any; navigation: any }) {
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.1, duration: 350, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 350, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  return (
    <SafeAreaView style={styles.safeAreaCentered}>
      <Animated.View style={[styles.celebrationCircle, { transform: [{ scale: pulse }] }]}>
        <Ionicons name="checkmark" size={58} color={palette.white} />
      </Animated.View>
      <Text style={styles.h2}>Goal complete!</Text>
      <Text style={styles.subtitle}>
        {route.params?.goalTitle ?? 'Your goal'} finished with love.
      </Text>
      <Pressable style={styles.primaryButton} onPress={() => navigation.goBack()}>
        <Text style={styles.primaryButtonText}>Back to goals</Text>
      </Pressable>
    </SafeAreaView>
  );
}

function SettingsScreen({
  profile,
  inviteCode,
  onSignOut,
  onUpdateReminderPrefs,
}: {
  profile: UserProfile;
  inviteCode: string;
  onSignOut: () => Promise<void>;
  onUpdateReminderPrefs: (updates: Partial<UserProfile>) => Promise<void>;
}) {
  const reminderEnabled = profile.reminderEnabled ?? false;
  const reminderHour = profile.reminderHour ?? 20;

  const shareInvite = async () => {
    const deepLink = `daintygoals://pair?code=${inviteCode}`;
    await Share.share({
      message: `Join our Dainty Goals couple space 💞\nInvite code: ${inviteCode}\nLink: ${deepLink}`,
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.card}>
        <Text style={styles.h2}>Settings</Text>
        <Text style={styles.subtitle}>Logged in as {profile.email}</Text>
        <Text style={styles.metaText}>Invite code: {inviteCode}</Text>
        <Pressable style={styles.secondaryButton} onPress={shareInvite}>
          <Text style={styles.secondaryButtonText}>Share invite</Text>
        </Pressable>

        <View style={styles.preferenceRow}>
          <Text style={styles.preferenceLabel}>Daily gentle reminders</Text>
          <Switch
            value={reminderEnabled}
            onValueChange={(value) => onUpdateReminderPrefs({ reminderEnabled: value })}
            trackColor={{ false: '#ddd', true: palette.sage }}
          />
        </View>

        <View style={styles.row}>
          <Pressable
            style={styles.frequencyButton}
            onPress={() =>
              onUpdateReminderPrefs({
                reminderHour: reminderHour <= 6 ? 23 : reminderHour - 1,
              })
            }
          >
            <Text style={styles.secondaryButtonText}>Earlier</Text>
          </Pressable>
          <Text style={styles.subtitle}>Reminder hour: {reminderHour}:00</Text>
          <Pressable
            style={styles.frequencyButton}
            onPress={() =>
              onUpdateReminderPrefs({
                reminderHour: reminderHour >= 23 ? 7 : reminderHour + 1,
              })
            }
          >
            <Text style={styles.secondaryButtonText}>Later</Text>
          </Pressable>
        </View>

        <Pressable style={[styles.secondaryButton, { marginTop: 12 }]} onPress={onSignOut}>
          <Text style={styles.secondaryButtonText}>Sign out</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

export default function App() {
  return <AppShell />;
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: palette.cream,
    padding: 16,
  },
  safeAreaCentered: {
    flex: 1,
    backgroundColor: palette.cream,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  authContainer: {
    paddingTop: 42,
    gap: 16,
  },
  card: {
    backgroundColor: palette.white,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: palette.border,
    gap: 10,
    marginBottom: 12,
  },
  h1: {
    fontSize: 34,
    color: palette.plum,
    fontWeight: '600',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  h2: {
    fontSize: 25,
    color: palette.plum,
    fontWeight: '600',
    letterSpacing: 0.4,
  },
  subtitle: {
    color: palette.gray,
    fontSize: 15,
    lineHeight: 21,
  },
  metaText: {
    color: palette.gray,
    fontSize: 12,
  },
  completedText: {
    color: palette.mint,
    fontSize: 12,
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#fffdfb',
    color: palette.plum,
    fontSize: 15,
  },
  textArea: {
    minHeight: 92,
    textAlignVertical: 'top',
  },
  primaryButton: {
    backgroundColor: palette.rose,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: palette.white,
    fontWeight: '700',
    fontSize: 15,
  },
  secondaryButton: {
    borderColor: palette.lavender,
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 11,
    paddingHorizontal: 14,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: palette.plum,
    fontWeight: '600',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  frequencyButton: {
    borderColor: palette.lavender,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 9,
    paddingHorizontal: 14,
    alignItems: 'center',
  },
  frequencySelected: {
    borderColor: palette.rose,
    backgroundColor: palette.blush,
  },
  goalCard: {
    backgroundColor: palette.white,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: palette.border,
    marginBottom: 10,
    gap: 5,
  },
  goalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  goalTitle: {
    fontSize: 17,
    color: palette.plum,
    fontWeight: '600',
    flex: 1,
    paddingRight: 8,
  },
  checkButton: {
    padding: 4,
  },
  progressTrack: {
    height: 8,
    borderRadius: 8,
    backgroundColor: palette.lavender,
    overflow: 'hidden',
  },
  progressFill: {
    height: 8,
    borderRadius: 8,
    backgroundColor: palette.mint,
  },
  listPad: {
    paddingBottom: 30,
  },
  halfInput: {
    flex: 1,
  },
  celebrationCircle: {
    height: 110,
    width: 110,
    borderRadius: 55,
    backgroundColor: palette.rose,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  preferenceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fffdfb',
    borderWidth: 1,
    borderColor: palette.border,
    borderRadius: 14,
    padding: 12,
    marginTop: 6,
  },
  preferenceLabel: {
    color: palette.plum,
    fontSize: 15,
    fontWeight: '500',
  },
  mono: {
    fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' }),
    fontSize: 12,
    lineHeight: 18,
    color: palette.gray,
  },
});
