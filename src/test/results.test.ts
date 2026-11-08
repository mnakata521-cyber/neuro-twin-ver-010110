import { describe, expect, it } from "vitest";
import { SUPPLIED_FLAGS, SUPPLIED_LABELS } from "@/components/Results";
import { SCENARIOS } from "@/lib/trajectory";

// Labels preserved exactly as supplied in the TKS workbook — do not "correct" them.
describe("Results tab supplied labels", () => {
  it("sessions 1–10 have no classification entered (blank)", () => {
    expect(SUPPLIED_LABELS.slice(0, 10)).toEqual(Array(10).fill(null));
  });

  it("session 18 (score 80) is labeled Within, as supplied", () => {
    expect(SCENARIOS["Temporary Dip"][17]).toBe(80);
    expect(SUPPLIED_LABELS[17]).toBe("Within");
  });

  it("session 19 (score 79) is labeled Below, as supplied", () => {
    expect(SCENARIOS["Temporary Dip"][18]).toBe(79);
    expect(SUPPLIED_LABELS[18]).toBe("Below");
  });

  it("session 20 (score 90) is labeled Below, as supplied", () => {
    expect(SCENARIOS["Temporary Dip"][19]).toBe(90);
    expect(SUPPLIED_LABELS[19]).toBe("Below");
  });

  it("sessions 21–30 are labeled Within, as supplied", () => {
    expect(SUPPLIED_LABELS.slice(20)).toEqual(Array(10).fill("Within"));
  });

  it("sustained-change flag column is blank for all 30 sessions, as supplied", () => {
    expect(SUPPLIED_FLAGS).toEqual(Array(30).fill(null));
  });
});
