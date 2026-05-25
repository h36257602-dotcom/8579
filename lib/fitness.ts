// ============================================================================
// Fitness 시스템 - XP, 레벨, 칭호 계산
// ============================================================================

// 레벨 N 까지의 누적 XP = 100 * N(N+1)/2
// Lv10 = 5,500 / Lv20 = 21,000 / Lv50 = 127,500 / Lv100 = 505,000
export function xpForLevel(level: number): number {
  return Math.round((100 * level * (level + 1)) / 2);
}

export function levelFromXp(xp: number): {
  level: number;
  currentLevelXp: number;
  nextLevelXp: number;
  progressPct: number;
  title: string;
  tierColor: string;
} {
  let level = 1;
  while (xpForLevel(level + 1) <= xp && level < 200) level++;
  const currentLevelXp = xpForLevel(level);
  const nextLevelXp = xpForLevel(level + 1);
  const span = nextLevelXp - currentLevelXp;
  const into = xp - currentLevelXp;
  const progressPct = span > 0 ? (into / span) * 100 : 0;
  return { level, currentLevelXp, nextLevelXp, progressPct, ...titleFor(level) };
}

function titleFor(level: number): { title: string; tierColor: string } {
  if (level >= 100) return { title: "전설의 인간", tierColor: "from-amber-400 via-rose-500 to-violet-600" };
  if (level >= 50)  return { title: "괴물",       tierColor: "from-rose-500 to-violet-600" };
  if (level >= 30)  return { title: "엘리트",     tierColor: "from-cyan-400 to-violet-500" };
  if (level >= 20)  return { title: "상급자",     tierColor: "from-emerald-400 to-cyan-500" };
  if (level >= 10)  return { title: "운동선수",   tierColor: "from-emerald-400 to-teal-500" };
  return                  { title: "입문자",     tierColor: "from-zinc-500 to-zinc-700" };
}

// 운동 1건당 XP 계산
export function calcWorkoutXp(w: {
  duration: number;
  sets: number;
  reps: number;
  weight: number;
  distance: number;
  rpe: number | null;
  is_pr?: boolean;
}): number {
  let xp = 0;
  xp += (w.duration || 0) * 2;                       // 분당 2 XP
  xp += (w.sets || 0) * (w.reps || 0) * 0.5;         // 볼륨
  xp += Math.floor((w.weight || 0) * (w.reps || 0) * 0.05);  // 중량 보너스
  xp += Math.floor((w.distance || 0) * 30);          // km당 30 XP
  if (w.rpe) xp += w.rpe * 3;                        // 강도 보너스
  if (w.is_pr) xp += 200;                            // PR 보너스
  return Math.round(xp);
}

export const WORKOUT_CATEGORIES = [
  "웨이트", "러닝", "크로스핏", "등산", "사이클",
  "수영", "격투기", "스트레칭", "재활운동", "자유운동",
] as const;

export const BODY_PARTS = [
  "가슴", "등", "어깨", "팔", "코어", "하체", "전신", "유산소",
] as const;

export const CONDITIONS = ["최상", "좋음", "보통", "나쁨", "최악"] as const;

// 카테고리별 색상 (네온 톤)
export const CATEGORY_NEON: Record<string, string> = {
  웨이트:    "text-rose-400 border-rose-500/40 bg-rose-500/10",
  러닝:      "text-cyan-400 border-cyan-500/40 bg-cyan-500/10",
  크로스핏:  "text-amber-400 border-amber-500/40 bg-amber-500/10",
  등산:      "text-emerald-400 border-emerald-500/40 bg-emerald-500/10",
  사이클:    "text-sky-400 border-sky-500/40 bg-sky-500/10",
  수영:      "text-blue-400 border-blue-500/40 bg-blue-500/10",
  격투기:    "text-red-400 border-red-500/40 bg-red-500/10",
  스트레칭:  "text-violet-400 border-violet-500/40 bg-violet-500/10",
  재활운동:  "text-teal-400 border-teal-500/40 bg-teal-500/10",
  자유운동:  "text-zinc-300 border-zinc-500/40 bg-zinc-500/10",
};

// 카테고리별 입력 필드 / 추천 운동
export type WorkoutField = "body_part" | "sets" | "reps" | "weight" | "duration" | "distance" | "calories" | "rpe";

export const CATEGORY_CONFIG: Record<string, {
  fields: WorkoutField[];        // 표시할 필드
  presets: string[];             // 추천 운동명
  bodyParts?: readonly string[]; // 이 카테고리에 적합한 부위만
  placeholder: string;           // 운동명 placeholder
  accent: string;                // 강조 색 (CSS 변수 호환 컬러명)
}> = {
  웨이트: {
    fields: ["body_part", "sets", "reps", "weight", "rpe"],
    presets: ["벤치프레스", "데드리프트", "스쿼트", "오버헤드프레스", "바벨로우", "풀업", "딥스", "레그프레스"],
    bodyParts: ["가슴", "등", "어깨", "팔", "코어", "하체", "전신"] as const,
    placeholder: "예: 벤치프레스",
    accent: "rose",
  },
  러닝: {
    fields: ["distance", "duration", "calories", "rpe"],
    presets: ["5km 러닝", "10km 러닝", "조깅 30분", "인터벌 트레이닝", "트레드밀", "야외 러닝"],
    placeholder: "예: 한강 러닝 5km",
    accent: "cyan",
  },
  크로스핏: {
    fields: ["sets", "reps", "weight", "duration", "rpe"],
    presets: ["WOD: Fran", "WOD: Cindy", "WOD: Murph", "버피", "박스점프", "케틀벨 스윙", "와일드 스내치"],
    placeholder: "예: WOD: Fran",
    accent: "amber",
  },
  등산: {
    fields: ["duration", "distance", "calories", "rpe"],
    presets: ["북한산", "관악산", "남산", "도봉산", "지리산", "한라산"],
    placeholder: "예: 북한산 백운대",
    accent: "emerald",
  },
  사이클: {
    fields: ["distance", "duration", "calories", "rpe"],
    presets: ["로드 라이딩", "MTB", "실내 스피닝", "한강 자전거", "출퇴근 라이딩"],
    placeholder: "예: 한강 라이딩 30km",
    accent: "sky",
  },
  수영: {
    fields: ["distance", "duration", "calories", "rpe"],
    presets: ["자유형 1km", "평영", "배영", "접영", "혼영", "킥판 발차기"],
    placeholder: "예: 자유형 1000m",
    accent: "blue",
  },
  격투기: {
    fields: ["duration", "calories", "rpe"],
    presets: ["복싱 스파링", "무에타이", "주짓수 롤링", "MMA", "킥복싱", "샌드백"],
    placeholder: "예: 복싱 스파링 3R",
    accent: "red",
  },
  스트레칭: {
    fields: ["body_part", "duration"],
    presets: ["전신 스트레칭", "폼롤러", "요가", "필라테스", "정적 스트레칭", "PNF 스트레칭"],
    bodyParts: ["전신", "하체", "등", "어깨", "코어"] as const,
    placeholder: "예: 폼롤러 마사지",
    accent: "violet",
  },
  재활운동: {
    fields: ["body_part", "sets", "reps", "duration"],
    presets: ["코어 안정화", "맥켄지 운동", "물리치료 루틴", "어깨 가동성", "발목 강화"],
    bodyParts: ["코어", "등", "어깨", "팔", "하체"] as const,
    placeholder: "예: 코어 안정화 운동",
    accent: "teal",
  },
  자유운동: {
    fields: ["body_part", "sets", "reps", "weight", "duration", "distance", "calories", "rpe"],
    presets: [],
    placeholder: "운동명 자유 입력",
    accent: "zinc",
  },
};
