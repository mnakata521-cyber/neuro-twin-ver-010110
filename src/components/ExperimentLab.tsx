import { useMemo, useState } from "react";
import {
  analyze, BASELINE_SESSIONS, DEFAULT_RULE, SCENARIOS, SHARED_CUTOFF, TOTAL_SESSIONS,
  type RuleOptions, type ScenarioName,
} from "@/lib/trajectory";

const NAMES = Object.keys(SCENARIOS) as ScenarioName[];
const WIDTHS = [1, 2, 3];
const RUNS = [1, 2, 3, 4, 5];

export function ExperimentLab() {
  // Lab state is local; the Session Replay always uses DEFAULT_RULE.
  const [opts, setOpts] = useState<RuleOptions>({ ...DEFAULT_RULE });
  const isDefault = opts.sdMultiplier === DEFAULT_RULE.sdMultiplier && opts.runLength === DEFAULT_RULE.runLength;

  const results = useMemo(
    () => NAMES.map((n) => ({ name: n, r: analyze(SCENARIOS[n], TOTAL_SESSIONS, opts) })),
    [opts],
  );

  return (
    <div className="space-y-6">
      <div className="rounded-md border bg-muted p-4 text-sm">
        <p className="font-semibold">Full-data lab — separate from the replay.</p>
        <p className="text-muted-foreground">
          This tab evaluates all {TOTAL_SESSIONS} sessions at once. Its settings never change the Session Replay, which
          always uses the original rule (2 SD, 3 departures).
        </p>
      </div>

      <section className="rounded-lg border bg-card p-4 sm:p-5">
        <h2 className="text-lg font-semibold">Can you flag the constructed gradual-change scenario without also flagging the temporary dip?</h2>

        <div className="mt-4 grid gap-5 sm:grid-cols-2">
          <fieldset>
            <legend className="mb-2 text-sm font-medium">Boundary width (baseline sample SDs below the baseline)</legend>
            <div className="flex gap-2" role="radiogroup">
              {WIDTHS.map((w) => (
                <Choice key={w} active={opts.sdMultiplier === w} onClick={() => setOpts((o) => ({ ...o, sdMultiplier: w }))}>{w} SD</Choice>
              ))}
            </div>
          </fieldset>
          <fieldset>
            <legend className="mb-2 text-sm font-medium">Required consecutive departures</legend>
            <div className="flex gap-2" role="radiogroup">
              {RUNS.map((k) => (
                <Choice key={k} active={opts.runLength === k} onClick={() => setOpts((o) => ({ ...o, runLength: k }))}>{k}</Choice>
              ))}
            </div>
          </fieldset>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3 text-sm">
          <button onClick={() => setOpts({ ...DEFAULT_RULE })} disabled={isDefault}
            className="rounded-md border bg-background px-3 py-1.5 font-medium hover:bg-accent disabled:opacity-50">
            ↺ Reset to original settings
          </button>
          <span className="text-muted-foreground">
            Current: {opts.sdMultiplier} SD, {opts.runLength} departure{opts.runLength > 1 ? "s" : ""}
            {isDefault ? " (original)" : ""}. Earliest possible flag: session {BASELINE_SESSIONS + opts.runLength}.
          </span>
        </div>
      </section>

      <section className="overflow-x-auto rounded-lg border bg-card">
        <table className="w-full text-sm">
          <thead className="text-left text-muted-foreground">
            <tr className="border-b">
              <th className="p-3">Scenario</th>
              <th className="p-3">Personal lower boundary</th>
              <th className="p-3">First personal-rule flag</th>
              <th className="p-3">First below cutoff ({SHARED_CUTOFF})</th>
            </tr>
          </thead>
          <tbody>
            {results.map(({ name, r }) => (
              <tr key={name} className="border-b last:border-0">
                <td className="p-3 font-medium">{name}</td>
                <td className="p-3 font-mono">{r.baseline ? r.baseline.lower.toFixed(2) : "—"}</td>
                <td className="p-3 font-mono">
                  {r.firstFlag ? (
                    <span className="font-semibold">● Session {r.firstFlag.session}
                      <span className="block text-xs font-normal text-muted-foreground">sessions {r.firstFlag.sessions[0]}–{r.firstFlag.session}</span>
                    </span>
                  ) : "○ No flag"}
                </td>
                <td className="p-3 font-mono">{r.firstCutoff ? `Session ${r.firstCutoff}` : "Not crossed"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <p className="rounded-md border border-boundary bg-warning p-4 text-sm">
        A setting that separates these hand-constructed examples is not clinically validated and may not generalize to
        other data. Synthetic data. Experimental thresholds. Not clinical evidence.
      </p>
    </div>
  );
}

function Choice({ active, children, onClick }: { active: boolean; children: React.ReactNode; onClick: () => void }) {
  return (
    <button role="radio" aria-checked={active} onClick={onClick}
      className={`min-w-11 rounded-md border px-3 py-1.5 text-sm font-medium transition-colors ${active ? "border-primary bg-primary text-primary-foreground" : "bg-background hover:bg-accent"}`}>
      {children}
    </button>
  );
}
