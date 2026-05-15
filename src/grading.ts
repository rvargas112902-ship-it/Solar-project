export type Criterion = {
  id: string;
  title: string;
  expectation: string;
  weight: number;
  keywords: string[];
};

export type CriterionScore = {
  criterionId: string;
  title: string;
  expectation: string;
  score: number;
  maxScore: number;
  percentage: number;
  matchedKeywords: string[];
  missedKeywords: string[];
  feedback: string;
};

export type PitchMetrics = {
  wordCount: number;
  questionCount: number;
  fillerCount: number;
  nextStepMentioned: boolean;
};

export type GradeResult = {
  overallScore: number;
  overallPercentage: number;
  letterGrade: string;
  totalPossible: number;
  metrics: PitchMetrics;
  criterionScores: CriterionScore[];
  summary: string;
  recommendations: string[];
};

const fillerWords = [
  "um",
  "uh",
  "like",
  "you know",
  "sort of",
  "kind of",
  "basically",
  "actually",
];

const nextStepPhrases = [
  "next step",
  "follow up",
  "schedule",
  "book",
  "calendar",
  "proposal",
  "contract",
  "demo",
  "send over",
];

export const defaultCriteria: Criterion[] = [
  {
    id: "opening",
    title: "Clear opening and agenda",
    expectation:
      "Open confidently, confirm the prospect's goal, and set a clear agenda for the conversation.",
    weight: 15,
    keywords: ["agenda", "goal", "today", "understand", "help"],
  },
  {
    id: "discovery",
    title: "Discovery and qualification",
    expectation:
      "Ask questions that uncover pain, decision criteria, budget, timeline, and decision makers.",
    weight: 25,
    keywords: ["challenge", "pain", "budget", "timeline", "decision", "priority"],
  },
  {
    id: "value",
    title: "Value proposition",
    expectation:
      "Connect benefits to the prospect's needs instead of only describing product features.",
    weight: 25,
    keywords: ["save", "increase", "reduce", "benefit", "roi", "because"],
  },
  {
    id: "objections",
    title: "Objection handling",
    expectation:
      "Acknowledge concerns, answer them directly, and return to the business value.",
    weight: 20,
    keywords: ["concern", "understand", "however", "because", "value", "risk"],
  },
  {
    id: "close",
    title: "Strong close and next step",
    expectation:
      "Summarize the agreed value and ask for a specific next step with timing.",
    weight: 15,
    keywords: ["next step", "schedule", "when", "follow up", "proposal"],
  },
];

const normalizeText = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^\w\s?'-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const countPhrase = (transcript: string, phrase: string) => {
  const normalizedPhrase = normalizeText(phrase);

  if (!normalizedPhrase) {
    return 0;
  }

  const escaped = normalizedPhrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const matches = transcript.match(new RegExp(`\\b${escaped}\\b`, "g"));

  return matches?.length ?? 0;
};

const getLetterGrade = (percentage: number) => {
  if (percentage >= 90) return "A";
  if (percentage >= 80) return "B";
  if (percentage >= 70) return "C";
  if (percentage >= 60) return "D";
  return "F";
};

const buildFeedback = (
  criterion: Criterion,
  percentage: number,
  matchedKeywords: string[],
  missedKeywords: string[],
) => {
  if (!criterion.keywords.length) {
    return "Add keywords or phrases to make this category measurable.";
  }

  if (percentage >= 85) {
    return `Strong coverage. The pitch clearly included ${matchedKeywords.slice(0, 3).join(", ")}.`;
  }

  if (percentage >= 55) {
    return `Partial coverage. Reinforce ${missedKeywords.slice(0, 3).join(", ")} to better meet this expectation.`;
  }

  return `Needs work. The transcript did not clearly show ${missedKeywords.slice(0, 3).join(", ")}.`;
};

export const analyzePitchMetrics = (transcript: string): PitchMetrics => {
  const normalizedTranscript = normalizeText(transcript);
  const words = normalizedTranscript ? normalizedTranscript.split(" ") : [];

  return {
    wordCount: words.length,
    questionCount: (transcript.match(/\?/g) ?? []).length,
    fillerCount: fillerWords.reduce(
      (total, filler) => total + countPhrase(normalizedTranscript, filler),
      0,
    ),
    nextStepMentioned: nextStepPhrases.some(
      (phrase) => countPhrase(normalizedTranscript, phrase) > 0,
    ),
  };
};

export const gradePitch = (
  transcript: string,
  criteria: Criterion[],
): GradeResult => {
  const normalizedTranscript = normalizeText(transcript);
  const totalPossible = criteria.reduce((total, criterion) => total + criterion.weight, 0);

  const criterionScores = criteria.map((criterion) => {
    const matchedKeywords = criterion.keywords.filter(
      (keyword) => countPhrase(normalizedTranscript, keyword) > 0,
    );
    const missedKeywords = criterion.keywords.filter(
      (keyword) => !matchedKeywords.includes(keyword),
    );
    const keywordCoverage = criterion.keywords.length
      ? matchedKeywords.length / criterion.keywords.length
      : 0;
    const score = Math.round(keywordCoverage * criterion.weight * 10) / 10;
    const percentage = criterion.weight ? Math.round((score / criterion.weight) * 100) : 0;

    return {
      criterionId: criterion.id,
      title: criterion.title,
      expectation: criterion.expectation,
      score,
      maxScore: criterion.weight,
      percentage,
      matchedKeywords,
      missedKeywords,
      feedback: buildFeedback(criterion, percentage, matchedKeywords, missedKeywords),
    };
  });

  const overallScore = Math.round(
    criterionScores.reduce((total, item) => total + item.score, 0) * 10,
  ) / 10;
  const overallPercentage = totalPossible
    ? Math.round((overallScore / totalPossible) * 100)
    : 0;
  const metrics = analyzePitchMetrics(transcript);
  const recommendations = buildRecommendations(criterionScores, metrics);

  return {
    overallScore,
    overallPercentage,
    letterGrade: getLetterGrade(overallPercentage),
    totalPossible,
    metrics,
    criterionScores,
    summary: buildSummary(overallPercentage, metrics),
    recommendations,
  };
};

const buildSummary = (overallPercentage: number, metrics: PitchMetrics) => {
  if (!metrics.wordCount) {
    return "Add or record a pitch transcript to generate a grade.";
  }

  if (overallPercentage >= 80) {
    return "This pitch meets most expectations and gives the prospect a clear reason to continue.";
  }

  if (overallPercentage >= 60) {
    return "This pitch has a workable foundation, but several expectations need stronger proof in the talk track.";
  }

  return "This pitch needs a sharper structure, stronger qualification, and a clearer close.";
};

const buildRecommendations = (
  criterionScores: CriterionScore[],
  metrics: PitchMetrics,
) => {
  const recommendations = criterionScores
    .filter((item) => item.percentage < 70)
    .sort((a, b) => a.percentage - b.percentage)
    .slice(0, 3)
    .map((item) => `Improve ${item.title.toLowerCase()}: ${item.feedback}`);

  if (metrics.questionCount < 3 && metrics.wordCount > 0) {
    recommendations.push("Ask more discovery questions before presenting a solution.");
  }

  if (!metrics.nextStepMentioned && metrics.wordCount > 0) {
    recommendations.push("End with a specific next step, owner, and timeline.");
  }

  if (metrics.fillerCount > 10) {
    recommendations.push("Reduce filler words to make the pitch sound more confident.");
  }

  return recommendations.length
    ? recommendations
    : ["Keep the current structure and tighten examples with prospect-specific proof."];
};
