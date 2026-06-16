export interface User {
  id: string;
  email: string;
  name: string;
  coupleId: string | null;
  remindersEnabled: boolean;
  reminderTime: string;
  hasPush: boolean;
}

export interface Partner {
  id: string;
  name: string;
  email: string;
}

export interface Couple {
  id: string;
  inviteCode: string | null;
}

export type GoalType = 'daily' | 'weekly';

export interface Goal {
  id: string;
  type: GoalType;
  title: string;
  note: string | null;
  emoji: string;
  target: number;
  progress: number;
  completed: boolean;
  streak: number;
  createdBy: string;
  createdByName: string;
  completedBy: string | null;
  completedByName: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface MeResponse {
  user: User;
  partner: Partner | null;
  couple: Couple | null;
}

export interface Summary {
  weekKey: string;
  daily: { total: number; completed: number; unfinished: Goal[] };
  weekly: { total: number; completed: number; unfinished: Goal[] };
  bestStreak: number;
  goals: Goal[];
}
