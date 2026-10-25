import { describe, expect, it } from "vitest";
import { analyze, SCENARIOS } from "@/lib/trajectory";

describe("trajectory rules", () => {
  it("baseline uses sample SD of sessions 1-10", () => {
    const r = analyze(SCENARIOS["Stable"]);
    expect(r.mean).toBeCloseTo(90.6, 10);
    expect(r.lower).toBeCloseTo(90.6 - 2 * Math.sqrt(20.4 / 9), 10);
  });
  it("Stable has no flag", () => expect(analyze(SCENARIOS["Stable"]).firstFlag).toBeNull());
  it("Gradual Change flags at session 20", () => expect(analyze(SCENARIOS["Gradual Change"]).firstFlag).toBe(20));
  it("Temporary Dip (2 sessions) does not flag", () => expect(analyze(SCENARIOS["Temporary Dip"]).firstFlag).toBeNull());
  it("no scenario crosses cutoff 70", () => {
    for (const s of Object.values(SCENARIOS)) expect(analyze(s).firstCutoff).toBeNull();
  });
});
