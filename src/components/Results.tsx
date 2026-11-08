import { useMemo } from "react";
import {
  CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { analyze, SCENARIOS, SHARED_CUTOFF, TOTAL_SESSIONS } from "@/lib/trajectory";

// The Results tab presents the "Temporary Dip" scenario — the dataset described in the
// TKS workbook (session 18: 80, session 19: 79, session 20: 90).
const SCORES = SCENARIOS["Temporary Dip"];

/**
 * "Below personal boundary?" labels exactly as supplied in the workbook.
 * null = blank field, preserved as supplied (sessions 1–10 have no classification entered).
 * Sessions 11–17 were not labeled in the workbook; they are derived here with the same
 * rule (score strictly below the personal lower boundary of 87.59).
 */
export const SUPPLIED_LABELS: (string | null)[] = SCORES.map((score, i) => {
  const session = i + 1;
  if (session <= 10) return null; // no classification entered
  if (session === 18) return "Within"; // as supplied (80 vs. boundary 87.59 — preserved, not corrected)
  if (session === 19) return "Below"; // as supplied
  if (session === 20) return "Below"; // as supplied (90 vs. boundary 87.59 — preserved, not corrected)
  if (session >= 21) return "Within"; // as supplied
  return score !== null && score < 87.59 ? "Below" : "Within"; // derived for unlabeled sessions 11–17
});

// The sustained-change flag column is blank in the supplied spreadsheet — preserved as blank.
export const SUPPLIED_FLAGS: (string | null)[] = SCORES.map(() => null);

export function Results() {
  const r = useMemo(() => analyze(SCORES, TOTAL_SESSIONS), []);
  const b = r.baseline!;

  const chartData = useMemo(
    () =>
      Array.from({ length: TOTAL_SESSIONS }, (_, i) => ({
        session: i + 1,
        score: SCORES[i],
        baseline: b.mean,
        lower: b.lower,
        cutoff: SHARED_CUTOFF,
      })),
    [b],
  );

  return (
    <div className="space-y-6">
      <div className="rounded-md border bg-muted p-4 text-sm">
        <p className="font-semibold">Results — aligned with section 4 of the TKS technical article.</p>
        <p className="text-muted-foreground">
          A static summary of the full 30-session dataset. The Session Replay and Experiment Lab tabs are unchanged.
        </p>
      </div>

      {/* 1. Project overview */}
      <section className="rounded-lg border bg-card p-4 sm:p-5">
        <h2 className="text-lg font-semibold">1. Project overview</h2>
        <p className="mt-2 text-sm leading-relaxed">
          NeuroTwin explores how personalized neurological baselines can help identify changes in an individual's
          cognitive performance over time. This prototype — a Personal Trajectory Monitor — compares repeated
          individual measurements against two references: a personalized baseline computed from that individual's own
          first ten sessions, and an illustrative shared cutoff applied identically to everyone.
        </p>
      </section>

      {/* 2. Key metrics */}
      <section className="rounded-lg border bg-card p-4 sm:p-5">
        <h2 className="text-lg font-semibold">2. Key metrics</h2>
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-3">
          <Metric label="Simulated sessions" value={String(TOTAL_SESSIONS)} />
          <Metric label="Personal baseline average" value={b.mean.toFixed(1)} />
          <Metric label="Personal lower boundary" value={b.lower.toFixed(2)} />
          <Metric label="Illustrative shared cutoff" value={String(SHARED_CUTOFF)} />
        </div>
      </section>

      {/* 3. Data visualization */}
      <section className="rounded-lg border bg-card p-3 sm:p-5">
        <h2 className="px-1 pt-1 text-lg font-semibold">3. Data visualization</h2>
        <p className="px-1 text-xs text-muted-foreground">Vertical axis starts at 60, not 0.</p>
        <div className="mt-2 h-[26rem] sm:h-[28rem]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 20 }}>
              <CartesianGrid stroke="var(--border)" />
              <XAxis dataKey="session" type="number" domain={[1, 30]} ticks={[1, 5, 10, 15, 20, 25, 30]}
                label={{ value: "Session number", position: "insideBottom", offset: -12 }} />
              <YAxis domain={[60, 100]} ticks={[60, 70, 80, 90, 100]} allowDataOverflow
                label={{ value: "Simulated cognitive score", angle: -90, position: "insideLeft", offset: 20 }} />
              <Tooltip formatter={(v: number) => v.toFixed(1)} labelFormatter={(l) => `Session ${l}`} />
              <Legend verticalAlign="bottom" wrapperStyle={{ paddingTop: 28, fontSize: 13 }} />
              <Line name="Individual simulated scores" dataKey="score" stroke="var(--score)" strokeWidth={2.5} dot={{ r: 3 }} isAnimationActive={false} />
              <Line name="Personal baseline average (90.6)" dataKey="baseline" stroke="var(--baseline)" strokeDasharray="6 4" dot={false} isAnimationActive={false} />
              <Line name="Personal lower boundary (87.59)" dataKey="lower" stroke="var(--boundary)" strokeWidth={2} strokeDasharray="2 3" dot={false} isAnimationActive={false} />
              <Line name="Illustrative shared cutoff (70)" dataKey="cutoff" stroke="var(--cutoff)" strokeWidth={2} dot={false} isAnimationActive={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* 4. Interpretation of results */}
      <section className="rounded-lg border bg-card p-4 sm:p-5">
        <h2 className="text-lg font-semibold">4. Interpretation of results</h2>
        <p className="mt-2 text-sm leading-relaxed">
          Session 19 (score 79) falls below the personal lower boundary of 87.59 while remaining well above the
          illustrative shared cutoff of 70. A population-style cutoff alone would not flag this session, because 79 is
          still comfortably above 70 — yet relative to this individual's own baseline, the score is a clear departure.
          This illustrates how individual-level comparisons can reveal deviations that a universal cutoff might not
          flag.
        </p>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          These are simulated measurements from a constructed example, not actual patient data, and they do not
          constitute evidence of disease detection.
        </p>
      </section>

      {/* 5. Data table */}
      <section className="rounded-lg border bg-card">
        <h2 className="px-4 pt-4 text-lg font-semibold sm:px-5">5. Data table</h2>
        <p className="px-4 pb-2 text-xs text-muted-foreground sm:px-5">
          Original 30-session dataset with its existing column headings. Blank fields are preserved exactly as
          supplied; no inconsistencies have been corrected or reinterpreted.
        </p>
        <div className="overflow-x-auto px-2 pb-4 sm:px-3">
          <table className="w-full text-sm">
            <thead className="text-left text-muted-foreground">
              <tr className="border-b">
                <th className="p-2">Session</th>
                <th className="p-2">Simulated score</th>
                <th className="p-2">Baseline average</th>
                <th className="p-2">Personal lower boundary</th>
                <th className="p-2">Illustrative shared cutoff</th>
                <th className="p-2">Below personal boundary?</th>
                <th className="p-2">Sustained-change flag</th>
              </tr>
            </thead>
            <tbody className="font-mono">
              {SCORES.map((score, i) => (
                <tr key={i + 1} className="border-t">
                  <td className="p-2">{i + 1}</td>
                  <td className="p-2">{score}</td>
                  <td className="p-2">{b.mean.toFixed(1)}</td>
                  <td className="p-2">{b.lower.toFixed(2)}</td>
                  <td className="p-2">{SHARED_CUTOFF}</td>
                  <td className="p-2">{SUPPLIED_LABELS[i] ?? ""}</td>
                  <td className="p-2">{SUPPLIED_FLAGS[i] ?? ""}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* 6. What this demonstrates */}
      <section className="rounded-lg border bg-card p-4 sm:p-5">
        <h2 className="text-lg font-semibold">6. What this demonstrates</h2>
        <ul className="mt-2 list-disc space-y-2 pl-5 text-sm leading-relaxed">
          <li>
            <span className="font-semibold">Individual baselines are useful</span> because "normal" differs from
            person to person. A score that is unremarkable for the population may be unusual for a specific
            individual.
          </li>
          <li>
            <span className="font-semibold">Personalized monitoring differs from population-level thresholds</span>:
            a shared cutoff can only detect changes large enough to cross it, while a personal baseline can detect
            smaller departures relative to that individual's own typical performance.
          </li>
          <li>
            <span className="font-semibold">Repeated measurements matter</span> because a single score cannot
            distinguish a trend from ordinary day-to-day variation; a trajectory over many sessions can.
          </li>
          <li>
            <span className="font-semibold">Simulated results cannot establish clinical validity</span>: these data
            were constructed to illustrate the rule, so matching them is not independent evidence that the approach
            works on real people.
          </li>
        </ul>
      </section>

      {/* 7. Limitations */}
      <section className="rounded-lg border bg-card p-4 sm:p-5">
        <h2 className="text-lg font-semibold">7. Limitations</h2>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-relaxed">
          <li>The current dataset is simulated, not measured from real participants.</li>
          <li>The prototype is an educational proof of concept.</li>
          <li>It has not been clinically validated.</li>
          <li>It cannot diagnose Alzheimer's, Parkinson's, or any other neurological condition.</li>
        </ul>
      </section>

      {/* 8. Next steps */}
      <section className="rounded-lg border bg-card p-4 sm:p-5">
        <h2 className="text-lg font-semibold">8. Next steps</h2>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm leading-relaxed">
          <li>Testing with larger longitudinal datasets.</li>
          <li>Exploring multiple cognitive measurements.</li>
          <li>Investigating speech and motor measurements.</li>
          <li>Exploring how AI could identify patterns over time.</li>
        </ul>
      </section>

      <p className="rounded-md border border-boundary bg-warning p-4 text-sm">
        Synthetic data. Experimental thresholds. Not clinical evidence.
      </p>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border bg-background p-3 sm:p-4">
      <p className="text-xs text-muted-foreground sm:text-sm">{label}</p>
      <p className="mt-1 font-mono text-xl font-medium sm:text-2xl">{value}</p>
    </div>
  );
}
