import { describe, expect, it } from "vitest";
import { defaultCriteria, gradePitch } from "./grading";

describe("gradePitch", () => {
  it("scores keyword coverage across weighted criteria", () => {
    const result = gradePitch(
      "Today we will set an agenda to understand your goal and help with the challenge and pain. What budget, timeline, decision process, and priority matter most? This can save time, increase ROI, reduce risk, and deliver a clear benefit because it fits your team. I understand the concern; however, the value is stronger when we schedule the next step and follow up with a proposal.",
      defaultCriteria,
    );

    expect(result.overallPercentage).toBeGreaterThan(80);
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
