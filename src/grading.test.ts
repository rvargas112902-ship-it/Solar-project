import { describe, expect, it } from "vitest";
import { defaultCriteria, gradePitch } from "./grading";

describe("gradePitch", () => {
  it("scores keyword coverage across weighted criteria", () => {
    const result = gradePitch(
      "Today we will set an agenda, understand your challenge, discuss budget and timeline, show ROI, handle any concern, and schedule the next step.",
      defaultCriteria,
    );

    expect(result.overallPercentage).toBeGreaterThan(45);
    expect(result.criterionScores).toHaveLength(defaultCriteria.length);
    expect(result.criterionScores[0].matchedKeywords).toContain("agenda");
  });

  it("returns an empty-state recommendation when no transcript is present", () => {
    const result = gradePitch("", defaultCriteria);

    expect(result.overallPercentage).toBe(0);
    expect(result.summary).toContain("Add or record");
  });

  it("detects next-step language in the transcript metrics", () => {
    const result = gradePitch("The next step is to schedule a demo on Friday.", defaultCriteria);

    expect(result.metrics.nextStepMentioned).toBe(true);
  });
});
