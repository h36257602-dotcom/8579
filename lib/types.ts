export type Goal = {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  target_date: string | null;
  status: "active" | "done" | "paused";
  created_at: string;
};

export type Habit = {
  id: string;
  name: string;
  emoji: string | null;
  frequency: "daily" | "weekly";
  active: boolean;
  created_at: string;
};

export type HabitLog = {
  id: string;
  habit_id: string;
  date: string;
  done: boolean;
  note: string | null;
};

export type Asset = {
  id: string;
  name: string;
  category: string | null;
  amount: number;
  note: string | null;
  updated_at: string;
  created_at: string;
};

export type Hobby = {
  id: string;
  name: string;
  description: string | null;
  started_at: string | null;
  level: string | null;
  created_at: string;
};

export type Skill = {
  id: string;
  name: string;
  description: string | null;
  level: number;
  category: string | null;
  created_at: string;
};

export type Diary = {
  id: string;
  date: string;
  title: string | null;
  content: string;
  mood: string | null;
  created_at: string;
};

export type WorkItem = {
  id: string;
  title: string;
  project: string | null;
  status: "todo" | "doing" | "done";
  priority: "low" | "normal" | "high";
  due_date: string | null;
  note: string | null;
  done_at: string | null;
  created_at: string;
};

export type Workout = {
  id: string;
  date: string;
  category: string;
  name: string;
  body_part: string | null;
  sets: number;
  reps: number;
  weight: number;
  duration: number;
  distance: number;
  calories: number;
  rpe: number | null;
  condition: string | null;
  memo: string | null;
  xp: number;
  is_pr: boolean;
  created_at: string;
};

export type BodyMetric = {
  id: string;
  date: string;
  weight: number | null;
  body_fat: number | null;
  muscle_mass: number | null;
  bmi: number | null;
  sleep_score: number | null;
  condition_score: number | null;
  note: string | null;
  created_at: string;
};

export type FitnessProfile = {
  id: string;
  nickname: string;
  sport: string | null;
  total_xp: number;
  streak_days: number;
  last_workout_date: string | null;
  updated_at: string;
};

export type Achievement = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  icon: string | null;
  earned_at: string;
};

export type Trip = {
  id: string;
  name: string;
  destination: string | null;
  start_date: string | null;
  end_date: string | null;
  status: "planned" | "done" | "cancelled";
  budget: number;
  note: string | null;
  created_at: string;
};
