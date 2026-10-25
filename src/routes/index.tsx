import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  CartesianGrid, Legend, Line, LineChart, ReferenceArea, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { analyze, SCENARIOS, SHARED_CUTOFF } from "@/lib/trajectory";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Personal Trajectory Monitor" },
      { name: "description", content: "Student research demo comparing personal-baseline monitoring with a shared cutoff, using synthetic data." },
      { property: "og:title", content: "Personal Trajectory Monitor" },
      { property: "og:description", content: "Synthetic-data demo of personal-baseline monitoring with a sustained-change rule." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const NAMES = Object.keys(SCENARIOS);
const f = (n: number) => n.toFixed(1);

function Index() {
  const [name, setName] = useState(NAMES[0]);
  const result = useMemo(() => {
    try { return { ok: true as const, ...analyze(SCENARIOS[name]) }; }
    catch (e) { return { ok: false as const, error: (e as Error).message }; }
  }, [name]);

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:py-12">
      <header className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Personal Trajectory Monitor</h1>
        <p role="note" className="mt-4 rounded-md border border-boundary bg-warning px-4 py-3 font-semibold">
          ⚠ Synthetic data. Experimental thresholds. Not clinical evidence.
        </p>
      </header>

      <div className="mb-6" role="radiogroup" aria-label="Participant scenario">
        <p className="mb-2 text-sm font-medium text-muted-foreground">Participant scenario</p>
        <div className="flex flex-wrap gap-2">
          {NAMES.map((n) => (
            <button
              key={n} role="radio" aria-checked={n === name} onClick={() => setName(n)}
              className={`rounded-md border px-4 py-2 text-sm font-medium transition-colors ${n === name ? "border-primary bg-primary text-primary-foreground" : "bg-card hover:bg-accent"}`}
            >{n}</button>
          ))}
        </div>
      </div>

      {!result.ok ? (
        <p className="rounded-md border border-destructive p-4 text-destructive">
          Could not read the “{name}” scores: {result.error} No substitute data is shown.
        </p>
      ) : (
        <>
          <section className="grid gap-3 sm:grid-cols-3">
            <Card label="Baseline average (sessions 1–10)" value={f(result.mean)} swatch="bg-baseline" sub={`Sample SD ${result.sd.toFixed(2)}`} />
            <Card label="Personal lower boundary" value={f(result.lower)} swatch="bg-boundary" sub="Baseline − 2 × SD" />
            <Card label="Latest score (session 30)" value={f(result.latest)} swatch="bg-score" sub={`Shared cutoff: ${SHARED_CUTOFF}`} />
          </section>

          <section className="mt-3 grid gap-3 sm:grid-cols-2">
            <Result title="Sustained-change flag" text={result.firstFlag ? `Flag raised at session ${result.firstFlag}` : "No sustained-change flag"} hit={!!result.firstFlag} />
            <Result title="First session below shared cutoff (70)" text={result.firstCutoff ? `Session ${result.firstCutoff}` : "Not crossed"} hit={!!result.firstCutoff} />
          </section>

          <section className="mt-6 rounded-lg border bg-card p-3 sm:p-5">
            <h2 className="mb-3 font-semibold">Scores across 30 sessions</h2>
            <div className="h-80 sm:h-96">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={result.rows.map((r) => ({ ...r, baseline: result.mean, lower: result.lower, cutoff: SHARED_CUTOFF }))} margin={{ top: 10, right: 10, left: -10, bottom: 20 }}>
                  <CartesianGrid stroke="var(--border)" />
                  <ReferenceArea x1={1} x2={10} fill="var(--muted)" fillOpacity={0.8}
                    label={{ value: "Baseline period (1–10)", position: "insideTop", fill: "var(--muted-foreground)", fontSize: 12 }} />
                  <XAxis dataKey="session" type="number" domain={[1, 30]} ticks={[1, 5, 10, 15, 20, 25, 30]}
                    label={{ value: "Session", position: "insideBottom", offset: -12 }} />
                  <YAxis domain={[60, 100]} ticks={[60, 70, 80, 90, 100]} allowDataOverflow
                    label={{ value: "Simulated score", angle: -90, position: "insideLeft", offset: 20 }} />
                  <Tooltip formatter={(v: number) => v.toFixed(1)} labelFormatter={(l) => `Session ${l}`} />
                  <Legend verticalAlign="top" height={36} />
                  <Line name="Simulated score" dataKey="score" stroke="var(--score)" strokeWidth={2.5} dot={{ r: 3 }} isAnimationActive={false} />
                  <Line name="Baseline average" dataKey="baseline" stroke="var(--baseline)" strokeDasharray="6 4" dot={false} isAnimationActive={false} />
                  <Line name="Personal lower boundary" dataKey="lower" stroke="var(--boundary)" strokeWidth={2} strokeDasharray="2 3" dot={false} isAnimationActive={false} />
                  <Line name="Shared cutoff (70)" dataKey="cutoff" stroke="var(--cutoff)" strokeWidth={2} dot={false} isAnimationActive={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </section>

          <details className="mt-6 rounded-lg border bg-card">
            <summary className="cursor-pointer px-5 py-3 font-semibold">Session data table</summary>
            <div className="overflow-x-auto px-2 pb-4 sm:px-5">
              <table className="w-full text-sm">
                <thead className="text-left text-muted-foreground">
                  <tr><th className="p-2">Session</th><th className="p-2">Score</th><th className="p-2">vs. personal boundary</th><th className="p-2">Sustained change</th></tr>
                </thead>
                <tbody className="font-mono">
                  {result.rows.map((r) => (
                    <tr key={r.session} className="border-t">
                      <td className="p-2">{r.session}</td>
                      <td className="p-2">{f(r.score)}</td>
                      <td className="p-2">{r.below === null ? "Baseline" : r.below ? "Below" : "Within"}</td>
                      <td className="p-2">{r.session === result.firstFlag ? "First flag" : r.flag ? "Flag" : ""}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
        </>
      )}

      <section className="mt-8 space-y-3 text-sm leading-relaxed">
        <h2 className="text-lg font-semibold">How it works</h2>
        <ol className="list-decimal space-y-1 pl-5">
          <li>Sessions 1–10 set a fixed personal baseline: their average and sample standard deviation.</li>
          <li>The personal lower boundary is the baseline minus two standard deviations.</li>
          <li>From session 11 on, each score is checked: strictly lower than the boundary counts as “below”.</li>
          <li>Three consecutive “below” sessions raise a sustained-change flag (earliest possible: session 13).</li>
          <li>Separately, we report the first session under an illustrative shared cutoff of 70.</li>
        </ol>
        <p className="rounded-md border bg-muted p-4">
          This rule-based prototype illustrates personal-trajectory monitoring. It does not diagnose disease,
          identify the cause of a change, or demonstrate clinical effectiveness.
        </p>
      </section>
    </main>
  );
}

function Card({ label, value, sub, swatch }: { label: string; value: string; sub: string; swatch: string }) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <p className="flex items-center gap-2 text-sm text-muted-foreground"><span className={`h-3 w-3 rounded-full ${swatch}`} aria-hidden />{label}</p>
      <p className="mt-1 font-mono text-3xl font-medium">{value}</p>
      <p className="text-xs text-muted-foreground">{sub}</p>
    </div>
  );
}

function Result({ title, text, hit }: { title: string; text: string; hit: boolean }) {
  return (
    <div className={`rounded-lg border p-4 ${hit ? "border-cutoff bg-warning" : "bg-card"}`}>
      <p className="text-sm text-muted-foreground">{title}</p>
      <p className="mt-1 text-lg font-semibold">{hit ? "● " : "○ "}{text}</p>
    </div>
  );
}
