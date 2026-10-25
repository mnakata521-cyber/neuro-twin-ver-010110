// Scores extracted verbatim from Personal_Trajectory_Monitor.xlsx (column B, sessions 1–30).
// Constructed examples — not real people.
export const SCENARIOS = {
  Stable: [90, 92, 89, 91, 90, 93, 88, 91, 90, 92, 91, 89, 92, 90, 93, 91, 88, 90, 92, 91, 89, 93, 90, 91, 92, 88, 91, 90, 93, 89],
  "Gradual Change": [90, 92, 89, 91, 90, 93, 88, 91, 90, 92, 91, 90, 89, 90, 88, 87, 88, 86, 85, 86, 84, 83, 84, 82, 81, 82, 80, 79, 78, 77],
  "Temporary Dip": [90, 92, 89, 91, 90, 93, 88, 91, 90, 92, 91, 89, 92, 90, 93, 91, 90, 80, 79, 90, 92, 89, 91, 93, 90, 88, 92, 91, 89, 90],
} satisfies Record<string, (number | null)[]>;

export type ScenarioName = keyof typeof SCENARIOS;
export const SHARED_CUTOFF = 70;
export const BASELINE_SESSIONS = 10;
export const TOTAL_SESSIONS = 30;
export const RUN_LENGTH = 3;

const valid = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v);

export interface Row {
  session: number;
  score: number | null;
  below: boolean | null; // null = baseline session or missing score
  flag: boolean;
}

export type CutoffStatus = "above" | "at" | "below" | "none";
export type PersonalStatus = "establishing" | "monitoring" | "flagged" | "unavailable";

/**
 * Analyze one participant using ONLY sessions 1..upTo.
 * Scores are indexed by session (index 0 = session 1); null/invalid = missing.
 */
export function analyze(scores: readonly (number | null)[], upTo: number = TOTAL_SESSIONS) {
  const n = Math.max(0, Math.min(upTo, scores.length));
  const revealed = scores.slice(0, n);
  const warnings: string[] = [];
  revealed.forEach((s, i) => { if (!valid(s)) warnings.push(`Session ${i + 1} has a missing or invalid score.`); });

  let baseline: { mean: number; sd: number; lower: number } | null = null;
  if (n >= BASELINE_SESSIONS) {
    const base = scores.slice(0, BASELINE_SESSIONS);
    if (base.every(valid)) {
      const b = base as number[];
      const mean = b.reduce((a, c) => a + c, 0) / b.length;
      const sd = Math.sqrt(b.reduce((a, c) => a + (c - mean) ** 2, 0) / (b.length - 1));
      baseline = { mean, sd, lower: mean - 2 * sd };
    } else warnings.push("Baseline cannot be established: a baseline session (1–10) is missing.");
  }

  let run: number[] = [];
  let firstFlag = null as { session: number; sessions: number[]; scores: number[] } | null;
  let firstCutoff = null as number | null;
  const rows: Row[] = revealed.map((raw, i) => {
    const session = i + 1;
    const score = valid(raw) ? raw : null;
    if (score !== null && session > BASELINE_SESSIONS && score < SHARED_CUTOFF && firstCutoff === null) firstCutoff = session;
    if (session <= BASELINE_SESSIONS || !baseline || score === null) {
      if (score === null) run = []; // missing session breaks the sequence
      return { session, score, below: null, flag: false };
    }
    const below = score < baseline.lower;
    run = below ? [...run, session] : [];
    const flag = run.length >= RUN_LENGTH;
    if (flag && !firstFlag) {
      const seq = run.slice(-RUN_LENGTH);
      firstFlag = { session, sessions: seq, scores: seq.map((s) => scores[s - 1] as number) };
    }
    return { session, score, below, flag };
  });

  const lastValid = [...rows].reverse().find((r) => r.score !== null) ?? null;
  const latest = lastValid?.score ?? null;
  const cutoffStatus: CutoffStatus =
    latest === null ? "none" : latest > SHARED_CUTOFF ? "above" : latest === SHARED_CUTOFF ? "at" : "below";
  const personalStatus: PersonalStatus =
    n < BASELINE_SESSIONS ? "establishing" : !baseline ? "unavailable" : firstFlag ? "flagged" : "monitoring";
  const latestWithinBoundary = baseline && latest !== null && lastValid!.session > BASELINE_SESSIONS ? latest >= baseline.lower : null;

  return { upTo: n, rows, baseline, firstFlag, firstCutoff, latest, cutoffStatus, personalStatus, latestWithinBoundary, warnings };
}
