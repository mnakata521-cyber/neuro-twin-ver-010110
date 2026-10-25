import { describe, expect, it } from "vitest";
import { analyze, SCENARIOS } from "@/lib/trajectory";

describe("trajectory rules", () => {
  it("baseline matches spreadsheet AVERAGE/STDEV of sessions 1-10", () => {
    const b = analyze(SCENARIOS["Stable"]).baseline!;
    expect(b.mean).toBeCloseTo(90.6, 10);
    expect(b.lower).toBeCloseTo(90.6 - 2 * Math.sqrt(20.4 / 9), 10);
  });
  it("Stable has no flag", () => expect(analyze(SCENARIOS["Stable"]).firstFlag).toBeNull());
  it("Gradual Change first flag is sessions 18-20", () => {
    const f = analyze(SCENARIOS["Gradual Change"]).firstFlag!;
    expect(f.session).toBe(20);
    expect(f.sessions).toEqual([18, 19, 20]);
    expect(f.scores).toEqual([86, 85, 86]);
  });
  it("two-session dip does not flag", () => expect(analyze(SCENARIOS["Temporary Dip"]).firstFlag).toBeNull());
  it("no scenario crosses cutoff 70", () => {
    for (const s of Object.values(SCENARIOS)) expect(analyze(s).firstCutoff).toBeNull();
  });

  it("no baseline before session 10", () => {
    const r = analyze(SCENARIOS["Gradual Change"], 9);
    expect(r.baseline).toBeNull();
    expect(r.personalStatus).toBe("establishing");
    expect(r.rows).toHaveLength(9);
  });
  it("replay hides future: at session 19 no flag yet, at 20 flagged", () => {
    expect(analyze(SCENARIOS["Gradual Change"], 19).firstFlag).toBeNull();
    expect(analyze(SCENARIOS["Gradual Change"], 20).firstFlag?.session).toBe(20);
  });
  it("going forward again reproduces the full result", () => {
    analyze(SCENARIOS["Gradual Change"], 12);
    expect(analyze(SCENARIOS["Gradual Change"], 30)).toEqual(analyze(SCENARIOS["Gradual Change"]));
  });
  it("latest revealed score only", () => expect(analyze(SCENARIOS["Temporary Dip"], 18).latest).toBe(80));
  it("missing session breaks a sequence and warns", () => {
    const s: (number | null)[] = [...SCENARIOS["Gradual Change"]];
    s[18] = null; // session 19
    const r = analyze(s);
    expect(r.warnings.length).toBeGreaterThan(0);
    expect(r.firstFlag?.sessions).toEqual([20, 21, 22]);
  });
  it("recovery does not erase flag", () => {
    const s = [...SCENARIOS["Gradual Change"]];
    s[29] = 95;
    const r = analyze(s);
    expect(r.personalStatus).toBe("flagged");
    expect(r.latestWithinBoundary).toBe(true);
  });
});
