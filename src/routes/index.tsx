import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  CartesianGrid, Legend, Line, LineChart, ReferenceArea, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import {
  analyze, BASELINE_SESSIONS, SCENARIOS, SHARED_CUTOFF, TOTAL_SESSIONS, type ScenarioName,
} from "@/lib/trajectory";
import { ExperimentLab } from "@/components/ExperimentLab";
import { Results } from "@/components/Results";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Personal Trajectory Monitor" },
      { name: "description", content: "Interactive replay exploring the baseline and change-detection components of a proposed neurological digital twin, using synthetic data." },
      { property: "og:title", content: "Personal Trajectory Monitor" },
      { property: "og:description", content: "Session-by-session replay comparing a personal-baseline rule with an illustrative shared cutoff. Synthetic data." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const NAMES = Object.keys(SCENARIOS) as ScenarioName[];
const DESCRIPTIONS: Record<ScenarioName, string> = {
  Stable: "Constructed example: scores vary around a steady level.",
  "Gradual Change": "Constructed example: scores drift slowly downward.",
  "Temporary Dip": "Constructed example: a brief two-session drop, then return.",
};
const f = (n: number) => n.toFixed(1);

function Index() {
  const [tab, setTab] = useState<"replay" | "lab" | "results">("replay");

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:py-12">
      <header className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Personal Trajectory Monitor</h1>
        <p className="mt-2 text-muted-foreground">
          Exploring the baseline and change-detection components of a proposed neurological digital twin.
        </p>
        <p role="note" className="mt-4 rounded-md border border-boundary bg-warning px-4 py-3 font-semibold">
          ⚠ Synthetic data. Experimental thresholds. Not clinical evidence.
        </p>
        <p className="mt-2 text-xs text-muted-foreground">
          A single-signal, rule-based demonstration — not a complete neurological digital twin, trained AI model,
          diagnostic tool, or validated measure of neurological health.
        </p>
      </header>

      <div role="tablist" aria-label="View" className="mb-6 flex gap-1 border-b">
        {(["replay", "lab", "results"] as const).map((t) => (
          <button key={t} role="tab" aria-selected={tab === t} onClick={() => setTab(t)}
            className={`-mb-px border-b-2 px-4 py-2 text-sm font-semibold transition-colors ${tab === t ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"}`}
          >{t === "replay" ? "Session Replay" : t === "lab" ? "Experiment Lab" : "Results"}</button>
        ))}
      </div>

      {tab === "replay" ? <Dashboard /> : tab === "lab" ? <ExperimentLab /> : <Results />}
    </main>
  );
}

function Dashboard() {
  const [name, setName] = useState<ScenarioName>("Stable");
  const [session, setSession] = useState(1);
  const [playing, setPlaying] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduceMotion(mq.matches);
    const h = (e: MediaQueryListEvent) => setReduceMotion(e.matches);
    mq.addEventListener("change", h);
    return () => mq.removeEventListener("change", h);
  }, []);

  useEffect(() => {
    if (!playing) return;
    if (session >= TOTAL_SESSIONS) { setPlaying(false); return; }
    const t = setTimeout(() => setSession((s) => s + 1), reduceMotion ? 1400 : 700);
    return () => clearTimeout(t);
  }, [playing, session, reduceMotion]);

  const r = useMemo(() => analyze(SCENARIOS[name], session), [name, session]);
  const b = r.baseline;

  const chartData = useMemo(
    () => Array.from({ length: TOTAL_SESSIONS }, (_, i) => {
      const row = r.rows[i];
      const showRefs = b && i + 1 >= BASELINE_SESSIONS && i < r.upTo;
      return {
        session: i + 1,
        score: row?.score ?? null,
        baseline: showRefs ? b.mean : null,
        lower: showRefs ? b.lower : null,
        cutoff: i < r.upTo ? SHARED_CUTOFF : null,
      };
    }),
    [r, b],
  );

  const switchTo = (n: ScenarioName) => { setPlaying(false); setSession(1); setName(n); };

  return (
    <>


      <div className="mb-5" role="radiogroup" aria-label="Participant scenario">
        <p className="mb-2 text-sm font-medium text-muted-foreground">Participant scenario (constructed examples)</p>
        <div className="flex flex-wrap gap-2">
          {NAMES.map((n) => (
            <button key={n} role="radio" aria-checked={n === name} onClick={() => switchTo(n)}
              className={`rounded-md border px-4 py-2 text-sm font-medium transition-colors ${n === name ? "border-primary bg-primary text-primary-foreground" : "bg-card hover:bg-accent"}`}
            >{n}</button>
          ))}
        </div>
        <p className="mt-2 text-sm text-muted-foreground">{DESCRIPTIONS[name]}</p>
      </div>

      {/* Replay controls */}
      <section aria-label="Session replay" className="rounded-lg border bg-card p-4">
        <div className="flex flex-wrap items-center gap-3">
          <p className="font-mono text-lg" aria-live="polite">
            Session <span className="font-semibold">{session}</span> / {TOTAL_SESSIONS}
          </p>
          <div className="ml-auto flex gap-2">
            {playing ? (
              <CtrlBtn onClick={() => setPlaying(false)}>❚❚ Pause</CtrlBtn>
            ) : (
              <CtrlBtn primary onClick={() => { if (session >= TOTAL_SESSIONS) setSession(1); setPlaying(true); }}>▶ Play</CtrlBtn>
            )}
            <CtrlBtn onClick={() => { setPlaying(false); setSession(1); }}>↺ Reset</CtrlBtn>
          </div>
        </div>
        <div className="mt-3 flex items-center gap-2">
          <CtrlBtn aria-label="Previous session" onClick={() => { setPlaying(false); setSession((s) => Math.max(1, s - 1)); }}>‹</CtrlBtn>
          <input type="range" min={1} max={TOTAL_SESSIONS} value={session} aria-label="Selected session"
            onChange={(e) => { setPlaying(false); setSession(Number(e.target.value)); }}
            className="w-full accent-[var(--score)]" />
          <CtrlBtn aria-label="Next session" onClick={() => { setPlaying(false); setSession((s) => Math.min(TOTAL_SESSIONS, s + 1)); }}>›</CtrlBtn>
        </div>
        <p className="mt-2 text-sm font-medium">
          {session < BASELINE_SESSIONS
            ? `Baseline being established (${session} of ${BASELINE_SESSIONS} sessions).`
            : session === BASELINE_SESSIONS
              ? "Baseline established. Monitoring starts at session 11."
              : `Monitoring session ${session}. Baseline fixed from sessions 1–10.`}
        </p>
      </section>

      {r.warnings.length > 0 && (
        <div role="alert" className="mt-4 rounded-md border border-destructive p-4 text-sm text-destructive">
          <p className="font-semibold">Data warning — no scores were filled in or estimated.</p>
          <ul className="list-disc pl-5">{r.warnings.map((w) => <li key={w}>{w}</li>)}</ul>
        </div>
      )}

      {/* Summary */}
      <section className="mt-4 grid grid-cols-3 gap-2 sm:gap-3">
        <Stat label="Baseline average" swatch="bg-baseline" value={b ? f(b.mean) : "—"} sub={b ? `Sample SD ${b.sd.toFixed(2)}` : "Pending"} />
        <Stat label="Personal lower boundary" swatch="bg-boundary" value={b ? f(b.lower) : "—"} sub={b ? "Baseline − 2 SD" : "Pending"} />
        <Stat label="Latest task score" swatch="bg-score" value={r.latest !== null ? f(r.latest) : "—"} sub={`Session ${session}`} />
      </section>

      {/* Rule comparison */}
      <section className="mt-3 grid gap-3 sm:grid-cols-2">
        <RuleCard
          tag="A" title="Illustrative shared-cutoff rule" hit={r.cutoffStatus === "below" || r.cutoffStatus === "at"}
          status={{ above: "Above illustrative cutoff", at: "At illustrative cutoff", below: "Below illustrative cutoff", none: "No score available" }[r.cutoffStatus]}
          detail={`Latest score compared with ${SHARED_CUTOFF}. First monitoring session below: ${r.firstCutoff ? `session ${r.firstCutoff}` : "not crossed so far"}.`}
        />
        <RuleCard
          tag="B" title="Personal-baseline rule" hit={r.personalStatus === "flagged"}
          status={{ establishing: "Baseline being established", monitoring: "Monitoring: no sustained-change flag yet", flagged: "Sustained-change flag observed", unavailable: "Baseline unavailable (missing data)" }[r.personalStatus]}
          detail={
            r.firstFlag
              ? `First flag at session ${r.firstFlag.session} (kept as history). Latest score ${r.latestWithinBoundary ? "has returned to or above" : "remains below"} the personal lower boundary.`
              : r.personalStatus === "monitoring"
                ? r.latestWithinBoundary === null ? "Monitoring begins at session 11." : `Latest score is ${r.latestWithinBoundary ? "at or above" : "below"} the personal lower boundary.`
                : "Needs sessions 1–10 before any personal comparison."
          }
        />
      </section>

      {r.firstFlag && b && (
        <details className="mt-3 rounded-lg border border-cutoff bg-card">
          <summary className="cursor-pointer px-4 py-3 font-semibold">Why did this flag?</summary>
          <div className="space-y-3 px-4 pb-4 text-sm">
            <p>
              Sessions {r.firstFlag.sessions[0]}–{r.firstFlag.sessions[2]} each fell below the personal lower boundary
              of {b.lower.toFixed(2)}, completing the required three-session sequence.
            </p>
            <table className="font-mono">
              <thead className="text-left text-muted-foreground"><tr><th className="pr-6">Session</th><th className="pr-6">Score</th><th>vs. {b.lower.toFixed(2)}</th></tr></thead>
              <tbody>
                {r.firstFlag.sessions.map((s, i) => (
                  <tr key={s}><td>{s}</td><td>{f(r.firstFlag!.scores[i]!)}</td><td>Below</td></tr>
                ))}
              </tbody>
            </table>
            <p className="text-muted-foreground">
              Rule: from session 11, a score strictly below (baseline − 2 × sample SD) counts as a departure; three consecutive
              departures raise a flag. The rule does not identify a cause.
            </p>
          </div>
        </details>
      )}

      {/* Chart */}
      <section className="mt-6 rounded-lg border bg-card p-3 sm:p-5">
        <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="font-semibold">Simulated task score by session</h2>
          <p className="text-xs text-muted-foreground">Vertical axis starts at 60, not 0.</p>
        </div>
        <div className="h-[28rem] sm:h-[30rem]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 20 }}>
              <CartesianGrid stroke="var(--border)" />
              <ReferenceArea x1={1} x2={10} fill="var(--muted)" fillOpacity={0.9}
                label={{ value: "Baseline period (1–10)", position: "insideTop", fill: "var(--muted-foreground)", fontSize: 12 }} />
              <ReferenceLine x={10.5} stroke="var(--muted-foreground)" strokeDasharray="3 3"
                label={{ value: "Monitoring →", position: "insideTopRight", fill: "var(--muted-foreground)", fontSize: 11, dy: 18 }} />
              {r.firstFlag && (
                <ReferenceArea x1={r.firstFlag.sessions[0]! - 0.4} x2={r.firstFlag.sessions[2]! + 0.4}
                  fill="var(--cutoff)" fillOpacity={0.12} stroke="var(--cutoff)" strokeDasharray="4 3"
                  label={{ value: "First flag", position: "insideBottom", fill: "var(--cutoff)", fontSize: 11 }} />
              )}
              <XAxis dataKey="session" type="number" domain={[1, 30]} ticks={[1, 5, 10, 15, 20, 25, 30]}
                label={{ value: "Session", position: "insideBottom", offset: -12 }} />
              <YAxis domain={[60, 100]} ticks={[60, 70, 80, 90, 100]} allowDataOverflow
                label={{ value: "Simulated task score", angle: -90, position: "insideLeft", offset: 20 }} />
              <Tooltip formatter={(v: number) => v.toFixed(1)} labelFormatter={(l) => `Session ${l}`} />
              <Legend verticalAlign="bottom" wrapperStyle={{ paddingTop: 28, fontSize: 13 }} />
              <Line name="Simulated task score" dataKey="score" stroke="var(--score)" strokeWidth={2.5} dot={{ r: 3 }} connectNulls={false} isAnimationActive={!reduceMotion} animationDuration={300} />
              <Line name="Fixed personal baseline" dataKey="baseline" stroke="var(--baseline)" strokeDasharray="6 4" dot={false} isAnimationActive={false} />
              <Line name="Personal lower boundary" dataKey="lower" stroke="var(--boundary)" strokeWidth={2} strokeDasharray="2 3" dot={false} isAnimationActive={false} />
              <Line name="Illustrative shared cutoff (70)" dataKey="cutoff" stroke="var(--cutoff)" strokeWidth={2} dot={false} isAnimationActive={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>

      <details className="mt-4 rounded-lg border bg-card">
        <summary className="cursor-pointer px-5 py-3 font-semibold">Session data table (revealed sessions)</summary>
        <div className="overflow-x-auto px-2 pb-4 sm:px-5">
          <table className="w-full text-sm">
            <thead className="text-left text-muted-foreground">
              <tr><th className="p-2">Session</th><th className="p-2">Score</th><th className="p-2">vs. personal boundary</th><th className="p-2">Sustained change</th></tr>
            </thead>
            <tbody className="font-mono">
              {r.rows.map((row) => (
                <tr key={row.session} className="border-t">
                  <td className="p-2">{row.session}</td>
                  <td className="p-2">{row.score === null ? "Missing" : f(row.score)}</td>
                  <td className="p-2">{row.session <= BASELINE_SESSIONS ? "Baseline" : row.below === null ? "—" : row.below ? "Below" : "Within"}</td>
                  <td className="p-2">{row.session === r.firstFlag?.session ? "First flag" : row.flag ? "Flag" : ""}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>

      <section className="mt-10 grid gap-8 text-sm leading-relaxed md:grid-cols-2">
        <div>
          <h2 className="mb-3 text-lg font-semibold">How it works</h2>
          <ol className="list-decimal space-y-1 pl-5">
            <li>Sessions 1–10 set a fixed personal baseline: their average and sample standard deviation.</li>
            <li>Personal lower boundary = baseline − 2 standard deviations.</li>
            <li>From session 11, a score strictly below the boundary counts as a departure.</li>
            <li>Three consecutive departures raise a sustained-change flag (earliest: session 13). A missing session breaks the sequence.</li>
            <li>Separately, the latest score is compared with an illustrative shared cutoff of 70.</li>
          </ol>
          <p className="mt-3 text-muted-foreground">
            The three scenarios were constructed to illustrate the rule. Matching them is not independent validation.
          </p>
        </div>
        <div>
          <h2 className="mb-3 text-lg font-semibold">How this relates to a neurological digital twin</h2>
          <ol className="space-y-2">
            <li><span className="font-semibold">1. Personal baseline</span> — estimates typical simulated performance and variation.</li>
            <li><span className="font-semibold">2. Trajectory monitoring</span> — tracks repeated measurements over time. This version does not learn or update a progression model.</li>
            <li><span className="font-semibold">3. Deviation detection</span> — flags sustained departures using a transparent rule.</li>
          </ol>
          <p className="mt-3 rounded-md border bg-muted p-4">
            A full neurological digital twin would require more than this demonstration. This prototype does not model a
            real person’s neurological state or establish clinical usefulness.
          </p>
        </div>
      </section>

      <p className="mt-8 border-t pt-4 text-xs text-muted-foreground">
        This rule-based prototype illustrates personal-trajectory monitoring. It does not diagnose disease, identify the
        cause of a change, or demonstrate clinical effectiveness.
      </p>
    </>
  );
}

function CtrlBtn({ primary, className = "", ...p }: React.ButtonHTMLAttributes<HTMLButtonElement> & { primary?: boolean }) {
  return (
    <button {...p} className={`rounded-md border px-3 py-1.5 text-sm font-medium transition-colors ${primary ? "border-primary bg-primary text-primary-foreground hover:bg-primary/90" : "bg-background hover:bg-accent"} ${className}`} />
  );
}

function Stat({ label, value, sub, swatch }: { label: string; value: string; sub: string; swatch: string }) {
  return (
    <div className="rounded-lg border bg-card p-3 sm:p-4">
      <p className="flex items-start gap-1.5 text-xs text-muted-foreground sm:text-sm"><span className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${swatch}`} aria-hidden />{label}</p>
      <p className="mt-1 font-mono text-xl font-medium sm:text-3xl">{value}</p>
      <p className="text-xs text-muted-foreground">{sub}</p>
    </div>
  );
}

function RuleCard({ tag, title, status, detail, hit }: { tag: string; title: string; status: string; detail: string; hit: boolean }) {
  return (
    <div className={`rounded-lg border p-4 transition-colors ${hit ? "border-cutoff bg-warning" : "bg-card"}`}>
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Card {tag} · {title}</p>
      <p className="mt-1 text-lg font-semibold">{hit ? "● " : "○ "}{status}</p>
      <p className="mt-1 text-sm text-muted-foreground">{detail}</p>
    </div>
  );
}
