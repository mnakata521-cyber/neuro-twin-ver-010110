// Scores extracted verbatim from Personal_Trajectory_Monitor.xlsx (column B, sessions 1–30).
export const SCENARIOS = {
  Stable: [90, 92, 89, 91, 90, 93, 88, 91, 90, 92, 91, 89, 92, 90, 93, 91, 88, 90, 92, 91, 89, 93, 90, 91, 92, 88, 91, 90, 93, 89],
  "Gradual Change": [90, 92, 89, 91, 90, 93, 88, 91, 90, 92, 91, 90, 89, 90, 88, 87, 88, 86, 85, 86, 84, 83, 84, 82, 81, 82, 80, 79, 78, 77],
  "Temporary Dip": [90, 92, 89, 91, 90, 93, 88, 91, 90, 92, 91, 89, 92, 90, 93, 91, 90, 80, 79, 90, 92, 89, 91, 93, 90, 88, 92, 91, 89, 90],
} satisfies Record<string, number[]>;

export const SHARED_CUTOFF = 70;
export const BASELINE_SESSIONS = 10;

export interface Row {
  session: number;
  score: number;
  below: boolean | null;
  flag: boolean;
}

export function analyze(scores: number[]) {
  if (scores.length !== 30 || scores.some((s) => typeof s !== "number" || !Number.isFinite(s))) {
    throw new Error("Expected 30 numeric scores for this participant.");
  }
  const base = scores.slice(0, BASELINE_SESSIONS);
  const mean = base.reduce((a, b) => a + b, 0) / base.length;
  const sd = Math.sqrt(base.reduce((a, b) => a + (b - mean) ** 2, 0) / (base.length - 1));
  const lower = mean - 2 * sd;
  let run = 0;
  let firstFlag: number | null = null;
  let firstCutoff: number | null = null;
  const rows: Row[] = scores.map((score, i) => {
    const session = i + 1;
    if (session <= BASELINE_SESSIONS) return { session, score, below: null, flag: false };
    const below = score < lower;
    run = below ? run + 1 : 0;
    const flag = run >= 3;
    if (flag && firstFlag === null) firstFlag = session;
    if (score < SHARED_CUTOFF && firstCutoff === null) firstCutoff = session;
    return { session, score, below, flag };
  });
  return { mean, sd, lower, rows, firstFlag, firstCutoff, latest: scores[scores.length - 1] };
}
