import { describe, expect, it } from "vitest";
import { evaluatePitch } from "./grading";

describe("evaluatePitch", () => {
  it("returns zero scores for an empty transcript", () => {
    const result = evaluatePitch("");

    expect(result.overallScore).toBe(0);
    expect(result.categoryScores).toHaveLength(6);
    expect(result.categoryScores.every((c) => c.score === 0)).toBe(true);
    expect(result.summary).toContain("Paste or record");
  });

  it("scores a well-structured solar setter pitch across all 6 categories", () => {
    const pitch = [
      "Setter: Hey listen, I don't have much time. Do you see these powerlines here?",
      "Homeowner: Yeah.",
      "Setter: They're going underground because of the storm outages. Does that make sense?",
      "Homeowner: Yeah, we lost power for two days.",
      "Setter: Exactly, a lot of people around here did. The frustrating part is Duke is increasing rates to pay for all that infrastructure, so people are paying more for the same amount of power.",
      "Homeowner: Yeah, our bill has definitely gone up.",
      "Setter: That's why I stopped. If we can get you the power you're already using from Duke for significantly cheaper, we'll show you exactly what it looks like. Most neighbors are only paying $35-$40, so we probably can't help them. What's the lowest your Duke bill gets?",
      "Homeowner: $180 on the low end.",
      "Setter: Got it. And if I can't even save you money and it ends up costing more, what are you going to tell me?",
      "Homeowner: No.",
      "Setter: Exactly. What I look at is the squiggly line on your bill. It tells me how much power you are pulling annually and lets me know if I can save you money. Do you get this online or paper?",
    ].join("\n");

    const result = evaluatePitch(pitch);

    expect(result.overallScore).toBeGreaterThan(4);
    expect(result.categoryScores).toHaveLength(6);
    expect(result.categoryScores.map((c) => c.id)).toEqual([
      "objection_handling",
      "question_quality",
      "value_proposition",
      "pain_point_identification",
      "clarity",
      "structure_adherence",
    ]);
  });

  it("caps objection handling at 6 when no objections are present", () => {
    const pitch =
      "Setter: Hello, we help businesses reduce costs. What challenges are you facing? How does your current billing work? If we can save you money, we'll show you exactly what it looks like.";

    const result = evaluatePitch(pitch);
    const objectionScore = result.categoryScores.find(
      (c) => c.id === "objection_handling",
    );

    expect(objectionScore).toBeDefined();
    expect(objectionScore!.score).toBeLessThanOrEqual(6);
    expect(
      objectionScore!.weaknesses.some((w) =>
        w.toLowerCase().includes("no objections"),
      ),
    ).toBe(true);
  });

  it("notes reduced confidence when transcript is short", () => {
    const result = evaluatePitch("Hi there. Can I help?");

    expect(result.summary).toContain("short");
  });

  it("overall score is the average of all category scores rounded to one decimal", () => {
    const pitch =
      "Hey, I don't have much time. Duke is increasing rates. If we can get you the same power for cheaper, we'll show you. What's the lowest your bill gets? Do you get this online or paper?";

    const result = evaluatePitch(pitch);
    const expectedAvg =
      Math.round(
        (result.categoryScores.reduce((sum, c) => sum + c.score, 0) / 6) * 10,
      ) / 10;

    expect(result.overallScore).toBe(expectedAvg);
  });
});
