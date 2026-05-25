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

// ============================================================================
// Investment (투자)
// ============================================================================
export type InvHolding = {
  id: string;
  code: string;
  name: string;
  market: string | null;
  buy_date: string | null;
  buy_price: number;
  quantity: number;
  current_price: number;
  status: string | null;
  memo: string | null;
  created_at: string;
};

export type InvWatchlist = {
  id: string;
  code: string;
  name: string;
  current_price: number;
  target_buy: number;
  target_sell: number;
  reason: string | null;
  checkpoint: string | null;
  grade: string | null;
  reg_date: string | null;
  memo: string | null;
  created_at: string;
};

export type InvTrade = {
  id: string;
  date: string;
  name: string;
  type: string | null;
  price: number;
  quantity: number;
  amount: number;
  reason: string | null;
  feedback: string | null;
  learning: string | null;
  created_at: string;
};

export type InvMemo = {
  id: string;
  date: string;
  title: string;
  content: string | null;
  related: string | null;
  type: string | null;
  priority: string | null;
  created_at: string;
};

export type InvGoal = {
  id: string;
  name: string;
  target: number;
  current: number;
  deadline: string | null;
  status: string | null;
  created_at: string;
};

export type InvAnalysis = {
  id: string;
  code: string;
  growth: number;
  profit: number;
  stability: number;
  valuation: number;
  dividend: number;
  per: number;
  pbr: number;
  roe: number;
  debt: number;
  revenue_growth: number;
  op_growth: number;
  dividend_yield: number;
  issue: string | null;
  risk: string | null;
  judgment: string | null;
  updated_at: string;
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

export type TripDay = {
  id: string;
  trip_id: string;
  date: string;
  one_liner: string | null;
  mood: string | null;
  note: string | null;
  created_at: string;
};

export type TripPlace = {
  id: string;
  trip_id: string;
  date: string;
  time: string | null;
  name: string;
  category: string | null;
  rating: number | null;
  note: string | null;
  sort_order: number;
  created_at: string;
};

export type TripExpense = {
  id: string;
  trip_id: string;
  date: string | null;
  category: string | null;
  item: string;
  amount: number;
  note: string | null;
  created_at: string;
};
