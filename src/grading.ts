export type CategoryId =
  | "objection_handling"
  | "question_quality"
  | "value_proposition"
  | "pain_point_identification"
  | "clarity"
  | "structure_adherence";

export type CategoryScore = {
  id: CategoryId;
  name: string;
  score: number;
  feedback: string;
  strengths: string[];
  weaknesses: string[];
};

export type TranscriptMetrics = {
  wordCount: number;
  sentenceCount: number;
  questionCount: number;
  openEndedQuestionCount: number;
  fillerWordCount: number;
  avgWordsPerSentence: number;
};

export type EvaluationResult = {
  overallScore: number;
  categoryScores: CategoryScore[];
  metrics: TranscriptMetrics;
  summary: string;
};

const FILLER_WORDS = [
  "um",
  "uh",
  "like",
  "you know",
  "sort of",
  "kind of",
  "basically",
  "actually",
  "honestly",
  "i mean",
];

const SETTER_LABELS = [
  "setter",
  "rep",
  "agent",
  "salesperson",
  "sales rep",
  "caller",
  "sales",
  "representative",
];

const PROSPECT_LABELS = [
  "homeowner",
  "prospect",
  "customer",
  "buyer",
  "client",
  "wife",
  "husband",
  "spouse",
  "person",
];

const OBJECTION_PATTERNS = [
  "not interested",
  "no thanks",
  "no thank you",
  "don't have time",
  "dont have time",
  "don't want",
  "dont want",
  "too expensive",
  "can't afford",
  "cant afford",
  "need to think",
  "need to talk to",
  "talk to my spouse",
  "talk to my wife",
  "talk to my husband",
  "already have",
  "scam",
  "not for me",
  "waste of time",
  "bill is already low",
  "bill is low",
  "my bill is low",
  "we're good",
  "were good",
  "i'm good",
  "im good",
  "don't need",
  "dont need",
  "not looking",
  "we're fine",
  "were fine",
  "we're not interested",
  "were not interested",
  "leave me alone",
  "go away",
];

const ACKNOWLEDGE_PATTERNS = [
  "understand",
  "fair",
  "totally fair",
  "totally",
  "exactly",
  "you're right",
  "youre right",
  "that makes sense",
  "i hear you",
  "i get that",
  "i get it",
  "appreciate",
  "valid",
  "reasonable",
  "good question",
  "great question",
  "respect that",
];

const REFRAME_PATTERNS = [
  "that's why",
  "thats why",
  "that's exactly why",
  "thats exactly why",
  "however",
  "real quick",
  "before i",
  "what most people",
  "the reason",
  "what we find",
  "which is why",
  "that said",
  "at the same time",
  "most people",
  "a lot of people",
];

const BENEFIT_KEYWORDS = [
  "save",
  "saving",
  "savings",
  "cheaper",
  "lower",
  "reduce",
  "cut",
  "less",
  "better",
  "improve",
  "increase",
  "boost",
  "more efficient",
  "optimize",
  "benefit",
  "advantage",
  "roi",
  "return",
];

const OUTCOME_KEYWORDS = [
  "result",
  "outcome",
  "impact",
  "difference",
  "money",
  "cost",
  "payment",
  "bill",
  "rate",
  "price",
  "time",
  "productivity",
];

const HYPE_PATTERNS = [
  "ton of money",
  "no-brainer",
  "no brainer",
  "everyone is switching",
  "crazy not to",
  "guarantee",
  "trust me",
  "believe me",
  "best deal",
  "once in a lifetime",
  "limited time",
  "act now",
  "absolutely free",
  "risk free",
  "risk-free",
];

const PAIN_KEYWORDS = [
  "challenge",
  "problem",
  "issue",
  "frustrat",
  "pain",
  "struggle",
  "difficult",
  "expensive",
  "costly",
  "waste",
  "losing",
  "lost",
  "worry",
  "concern",
  "stress",
  "unhappy",
  "annoyed",
  "bothered",
  "crazy",
  "gone up",
  "increasing",
  "increase",
  "spike",
];

const EMPATHY_PATTERNS = [
  "a lot of people",
  "many people",
  "most people",
  "same thing",
  "hear that a lot",
  "exactly",
  "makes sense",
  "frustrating",
  "people around here",
  "people here",
  "said the same",
];

const DISCOVERY_TOPICS = [
  {
    topic: "pain",
    patterns: [
      "challenge",
      "problem",
      "issue",
      "struggle",
      "frustrat",
      "bother",
    ],
  },
  {
    topic: "goals",
    patterns: [
      "goal",
      "want",
      "hope",
      "looking for",
      "trying to",
      "need",
    ],
  },
  {
    topic: "budget",
    patterns: [
      "budget",
      "cost",
      "price",
      "afford",
      "invest",
      "spend",
      "bill",
      "payment",
      "rate",
    ],
  },
  {
    topic: "timeline",
    patterns: ["when", "timeline", "how long", "by when", "urgent"],
  },
  {
    topic: "decision",
    patterns: [
      "decide",
      "decision",
      "who else",
      "spouse",
      "wife",
      "husband",
      "both",
    ],
  },
  {
    topic: "current_state",
    patterns: [
      "currently",
      "right now",
      "today",
      "existing",
      "lowest",
      "highest",
    ],
  },
];

const INTRO_PATTERNS = [
  "hey",
  "hello",
  "hi",
  "good morning",
  "good afternoon",
  "good evening",
  "how are you",
  "don't have much time",
  "dont have much time",
  "my name is",
];

const CLOSE_PATTERNS = [
  "schedule",
  "appointment",
  "next step",
  "follow up",
  "follow-up",
  "set up",
  "book",
  "calendar",
  "meeting",
  "demo",
  "walkthrough",
  "proposal",
  "tomorrow",
  "today at",
  "better for you",
  "does that work",
  "when are you",
  "are you available",
  "online or paper",
];

const normalize = (text: string): string =>
  text
    .toLowerCase()
    .replace(/['']/g, "'")
    .replace(/[""]/g, '"')
    .replace(/\s+/g, " ")
    .trim();

const getWords = (text: string): string[] =>
  normalize(text)
    .split(/\s+/)
    .filter((w) => w.length > 0);

const getSentences = (text: string): string[] =>
  text
    .split(/[.!?]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 2);

const getQuestions = (text: string): string[] =>
  text
    .split(/(?<=[?])/)
    .filter((p) => p.trim().includes("?"))
    .map((p) => p.trim());

const containsPhrase = (text: string, phrase: string): boolean => {
  const normPhrase = normalize(phrase);
  const escaped = normPhrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  try {
    return new RegExp(`\\b${escaped}\\b`).test(normalize(text));
  } catch {
    return normalize(text).includes(normPhrase);
  }
};

const hasAny = (text: string, patterns: string[]): boolean =>
  patterns.some((p) => containsPhrase(text, p));

const countMatches = (text: string, patterns: string[]): number =>
  patterns.filter((p) => containsPhrase(text, p)).length;

const isOpenEndedQuestion = (question: string): boolean => {
  const norm = normalize(question);
  const openPatterns = [
    /\bwhat\b/,
    /\bhow\b/,
    /\bwhy\b/,
    /\bwhen\b/,
    /\bwhere\b/,
    /\bwho\b/,
    /\bwhich\b/,
    /\btell me\b/,
    /\bdescribe\b/,
  ];
  return openPatterns.some((p) => p.test(norm));
};

const clamp = (val: number, min: number, max: number): number =>
  Math.max(min, Math.min(max, val));

const parseDialogue = (
  transcript: string,
): { setterText: string; prospectText: string; isDialogue: boolean } => {
  const lines = transcript
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  const setterParts: string[] = [];
  const prospectParts: string[] = [];
  let dialogueDetected = false;

  for (const line of lines) {
    const match = line.match(/^([^:]{1,30}):\s*(.+)/);
    if (match) {
      const label = match[1].trim().toLowerCase();
      const text = match[2].trim();

      if (SETTER_LABELS.some((l) => label.includes(l))) {
        setterParts.push(text);
        dialogueDetected = true;
      } else if (PROSPECT_LABELS.some((l) => label.includes(l))) {
        prospectParts.push(text);
        dialogueDetected = true;
      }
    }
  }

  return {
    setterText: setterParts.join(" "),
    prospectText: prospectParts.join(" "),
    isDialogue: dialogueDetected,
  };
};

function scoreObjectionHandling(
  transcript: string,
  setterText: string,
  prospectText: string,
): CategoryScore {
  const checkText = prospectText || transcript;
  const responseText = setterText || transcript;

  const objectionsDetected = OBJECTION_PATTERNS.filter((p) =>
    containsPhrase(checkText, p),
  );
  const hasObjections = objectionsDetected.length > 0;

  const acknowledgeCount = countMatches(responseText, ACKNOWLEDGE_PATTERNS);
  const reframeCount = countMatches(responseText, REFRAME_PATTERNS);

  const strengths: string[] = [];
  const weaknesses: string[] = [];

  let score: number;

  if (!hasObjections) {
    let raw = 3;
    if (acknowledgeCount >= 1) {
      raw += 1;
      strengths.push("Uses acknowledgment language");
    }
    if (reframeCount >= 1) {
      raw += 1;
      strengths.push("Professional reframing language present");
    }
    const questions = getQuestions(responseText);
    if (questions.length >= 2) {
      raw += 1;
      strengths.push("Maintains conversational control through questions");
    }
    weaknesses.push("No objections occurred in transcript to evaluate handling");
    score = clamp(raw, 1, 6);

    return {
      id: "objection_handling",
      name: "Objection Handling",
      score,
      feedback: `No objections present in transcript. Score capped at 6. Conversational control ${score >= 5 ? "adequate" : "needs improvement"} based on available signals.`,
      strengths,
      weaknesses,
    };
  }

  score = 2;
  if (acknowledgeCount >= 2) {
    score += 2;
    strengths.push("Acknowledges objections effectively");
  } else if (acknowledgeCount >= 1) {
    score += 1;
    strengths.push("Some acknowledgment present");
  } else {
    weaknesses.push("Does not acknowledge objections");
  }

  if (reframeCount >= 2) {
    score += 2;
    strengths.push("Reframes concerns skillfully");
  } else if (reframeCount >= 1) {
    score += 1;
    strengths.push("Attempts to reframe");
  } else {
    weaknesses.push("No reframing of objections");
  }

  const questionsAfterResponse = getQuestions(responseText).length;
  if (questionsAfterResponse >= 1) {
    score += 1;
    strengths.push("Advances conversation after objection");
  } else {
    weaknesses.push("Fails to advance after objection");
  }

  if (objectionsDetected.length >= 2 && acknowledgeCount >= 2) {
    score += 1;
    strengths.push("Handles multiple objections");
  }

  const defensivePatterns = [
    "you're wrong",
    "that's not true",
    "actually no",
  ];
  if (countMatches(responseText, defensivePatterns) > 0) {
    score -= 1;
    weaknesses.push("Shows defensive patterns");
  }

  score = clamp(score, 1, 10);

  const feedback =
    score >= 7
      ? "Handles objections with composure. Acknowledges, reframes, and advances effectively."
      : score >= 5
        ? `Addresses some objections but ${weaknesses.length > 0 ? weaknesses[weaknesses.length - 1].toLowerCase() : "lacks consistency"}.`
        : `Objection handling is weak. ${weaknesses.length > 0 ? weaknesses[0] + "." : "Needs structured response framework."}`;

  return {
    id: "objection_handling",
    name: "Objection Handling",
    score,
    feedback,
    strengths,
    weaknesses,
  };
}

function scoreQuestionQuality(
  transcript: string,
  setterText: string,
): CategoryScore {
  const analysisText = setterText || transcript;
  const questions = getQuestions(analysisText);
  const words = getWords(analysisText);
  const strengths: string[] = [];
  const weaknesses: string[] = [];

  if (questions.length === 0) {
    return {
      id: "question_quality",
      name: "Question Quality",
      score: 1,
      feedback:
        "No questions detected in transcript. Questions are essential for discovery and qualification.",
      strengths: [],
      weaknesses: ["No questions asked"],
    };
  }

  let score = 2;

  const openEnded = questions.filter(isOpenEndedQuestion);
  const openRatio = openEnded.length / questions.length;

  if (questions.length >= 5) {
    score += 2;
    strengths.push(`${questions.length} questions asked`);
  } else if (questions.length >= 3) {
    score += 1;
    strengths.push(`${questions.length} questions asked`);
  } else {
    weaknesses.push("Too few questions for effective discovery");
  }

  if (openRatio >= 0.6) {
    score += 2;
    strengths.push("Strong open-ended questioning");
  } else if (openRatio >= 0.3) {
    score += 1;
    strengths.push("Mix of question types");
  } else {
    weaknesses.push("Relies heavily on closed questions");
  }

  const coveredTopics = DISCOVERY_TOPICS.filter((dt) =>
    dt.patterns.some((p) => containsPhrase(analysisText, p)),
  );
  if (coveredTopics.length >= 4) {
    score += 2;
    strengths.push("Covers multiple discovery areas");
  } else if (coveredTopics.length >= 2) {
    score += 1;
    strengths.push(
      `Covers ${coveredTopics.map((t) => t.topic).join(", ")}`,
    );
  } else {
    weaknesses.push("Limited discovery topic coverage");
  }

  const questionsPerHundredWords =
    words.length > 0 ? (questions.length / words.length) * 100 : 0;
  if (questionsPerHundredWords > 1 && questionsPerHundredWords < 8) {
    score += 1;
    strengths.push("Good question density");
  }

  if (openEnded.length === 0 && questions.length > 0) {
    score -= 1;
    weaknesses.push("All questions are closed-ended");
  }

  score = clamp(score, 1, 10);

  const feedback =
    score >= 7
      ? `Questions are strategic and drive discovery. ${openEnded.length} open-ended out of ${questions.length} total.`
      : score >= 5
        ? `Adequate questioning. ${openEnded.length} open-ended out of ${questions.length} total. ${weaknesses.length > 0 ? weaknesses[0] + "." : ""}`
        : `Questioning is weak. ${questions.length} total, ${openEnded.length} open-ended. ${weaknesses[0] || "Needs strategic question framework"}.`;

  return {
    id: "question_quality",
    name: "Question Quality",
    score,
    feedback,
    strengths,
    weaknesses,
  };
}

function scoreValueProposition(
  transcript: string,
  setterText: string,
): CategoryScore {
  const analysisText = setterText || transcript;
  const norm = normalize(analysisText);
  const strengths: string[] = [];
  const weaknesses: string[] = [];

  let score = 2;

  const benefitCount = countMatches(norm, BENEFIT_KEYWORDS);
  if (benefitCount >= 4) {
    score += 2;
    strengths.push("Multiple benefit-focused terms used");
  } else if (benefitCount >= 2) {
    score += 1;
    strengths.push("Some benefit language present");
  } else {
    weaknesses.push("Lacks clear benefit language");
  }

  const outcomeCount = countMatches(norm, OUTCOME_KEYWORDS);
  if (outcomeCount >= 3) {
    score += 1;
    strengths.push("Outcome-oriented communication");
  } else if (outcomeCount === 0) {
    weaknesses.push("No outcome-focused language");
  }

  const conditionalPatterns = [
    "if we can",
    "if the numbers",
    "if it doesn't",
    "if it does not",
    "if i can't",
    "if i cant",
    "if your usage",
    "see if",
    "check whether",
    "worth checking",
    "may not",
    "probably can't",
    "probably cant",
  ];
  if (hasAny(norm, conditionalPatterns)) {
    score += 2;
    strengths.push("Uses conditional framing that builds trust");
  }

  const hasNumbers = /\$\d+|\d+%|\d+ percent/.test(norm);
  const hasSpecificScenario =
    /your bill|your usage|your power|your rate|your payment|your situation/.test(
      norm,
    );
  if (hasNumbers) {
    score += 1;
    strengths.push("Uses specific numbers");
  }
  if (hasSpecificScenario) {
    score += 1;
    strengths.push("Relevant to prospect's situation");
  }

  const hypeCount = countMatches(norm, HYPE_PATTERNS);
  if (hypeCount > 0) {
    score -= hypeCount;
    weaknesses.push("Uses hype or exaggerated language");
  }

  if (benefitCount === 0 && outcomeCount === 0) {
    weaknesses.push("No clear value proposition communicated");
    score = clamp(score, 1, 3);
  }

  score = clamp(Math.round(score), 1, 10);

  const feedback =
    score >= 7
      ? `Clear, outcome-focused value proposition with relevant specifics.`
      : score >= 5
        ? `Value proposition is present but ${weaknesses.length > 0 ? weaknesses[0].toLowerCase() : "could be stronger"}. Needs more prospect-specific framing.`
        : `Weak value proposition. ${weaknesses[0] || "No clear reason for the prospect to care"}.`;

  return {
    id: "value_proposition",
    name: "Value Proposition",
    score,
    feedback,
    strengths,
    weaknesses,
  };
}

function scorePainPointIdentification(
  transcript: string,
  setterText: string,
  prospectText: string,
): CategoryScore {
  const setterNorm = normalize(setterText || transcript);
  const prospectNorm = normalize(prospectText);
  const strengths: string[] = [];
  const weaknesses: string[] = [];

  let score = 2;

  const painCount = countMatches(setterNorm, PAIN_KEYWORDS);
  if (painCount >= 4) {
    score += 2;
    strengths.push("Identifies multiple pain points");
  } else if (painCount >= 2) {
    score += 1;
    strengths.push("Some pain point awareness");
  } else {
    weaknesses.push("Minimal pain discovery");
  }

  const empathyCount = countMatches(setterNorm, EMPATHY_PATTERNS);
  if (empathyCount >= 3) {
    score += 2;
    strengths.push("Strong empathetic communication");
  } else if (empathyCount >= 1) {
    score += 1;
    strengths.push("Some empathy shown");
  } else {
    weaknesses.push("Lacks empathetic language");
  }

  const questions = getQuestions(setterText || transcript);
  const painQuestions = questions.filter((q) =>
    hasAny(q, [
      "bill",
      "cost",
      "pay",
      "rate",
      "price",
      "spike",
      "high",
      "bother",
      "frustrat",
      "challenge",
      "problem",
    ]),
  );
  if (painQuestions.length >= 2) {
    score += 2;
    strengths.push("Asks targeted pain-discovery questions");
  } else if (painQuestions.length >= 1) {
    score += 1;
    strengths.push("Asks about prospect pain");
  } else {
    weaknesses.push("No pain-discovery questions asked");
  }

  if (prospectText) {
    const prospectPainAck = hasAny(prospectNorm, [
      "gone up",
      "high",
      "crazy",
      "expensive",
      "too much",
      "a lot",
      "increased",
      "definitely",
    ]);
    if (prospectPainAck) {
      score += 1;
      strengths.push("Prospect acknowledges pain");
    }
  }

  const connectPatterns = [
    "that's why",
    "thats why",
    "that is why",
    "which is why",
    "the reason i",
    "that's exactly",
    "thats exactly",
  ];
  if (hasAny(setterNorm, connectPatterns) && painCount >= 1) {
    score += 1;
    strengths.push("Connects pain to offering");
  }

  const benefitMentioned = countMatches(setterNorm, BENEFIT_KEYWORDS);
  if (
    benefitMentioned >= 3 &&
    painCount === 0 &&
    painQuestions.length === 0
  ) {
    score -= 2;
    weaknesses.push("Pitches solution without diagnosing problems");
  }

  score = clamp(score, 1, 10);

  const feedback =
    score >= 7
      ? "Strong pain identification. Uncovers real frustrations and connects them to the offer."
      : score >= 5
        ? `Some pain identification present. ${weaknesses.length > 0 ? weaknesses[0] + "." : "Needs deeper discovery of prospect frustrations."}`
        : `Weak pain discovery. ${weaknesses[0] || "Does not uncover or address prospect problems"}.`;

  return {
    id: "pain_point_identification",
    name: "Pain Point Identification",
    score,
    feedback,
    strengths,
    weaknesses,
  };
}

function scoreClarity(
  transcript: string,
  setterText: string,
): CategoryScore {
  const analysisText = setterText || transcript;
  const words = getWords(analysisText);
  const sentences = getSentences(analysisText);
  const norm = normalize(analysisText);
  const strengths: string[] = [];
  const weaknesses: string[] = [];

  if (words.length === 0) {
    return {
      id: "clarity",
      name: "Clarity",
      score: 1,
      feedback: "No content to evaluate for clarity.",
      strengths: [],
      weaknesses: ["Empty transcript"],
    };
  }

  let score = 5;

  const fillerCount = FILLER_WORDS.reduce((total, filler) => {
    const escaped = filler.replace(/\s+/g, "\\s+");
    const regex = new RegExp(`\\b${escaped}\\b`, "gi");
    return total + (norm.match(regex) || []).length;
  }, 0);
  const fillerRatio = fillerCount / words.length;

  if (fillerRatio > 0.08) {
    score -= 2;
    weaknesses.push(`High filler word usage (${fillerCount} filler words)`);
  } else if (fillerRatio > 0.04) {
    score -= 1;
    weaknesses.push(`Moderate filler word usage (${fillerCount})`);
  } else if (fillerRatio < 0.02 && words.length > 20) {
    score += 1;
    strengths.push("Minimal filler words");
  }

  const avgWordsPerSentence =
    sentences.length > 0 ? words.length / sentences.length : words.length;
  if (avgWordsPerSentence > 35) {
    score -= 2;
    weaknesses.push("Excessively long sentences");
  } else if (avgWordsPerSentence > 25) {
    score -= 1;
    weaknesses.push("Sentences tend to run long");
  } else if (avgWordsPerSentence < 20 && avgWordsPerSentence > 5) {
    score += 1;
    strengths.push("Concise sentence structure");
  }

  const longSentences = sentences.filter(
    (s) => getWords(s).length > 35,
  );
  const longRatio =
    sentences.length > 0 ? longSentences.length / sentences.length : 0;
  if (longRatio > 0.3) {
    score -= 1;
    weaknesses.push("Significant rambling detected");
  }

  const transitions = [
    "so",
    "exactly",
    "got it",
    "now",
    "because",
    "then",
  ];
  const transitionCount = countMatches(norm, transitions);
  if (transitionCount >= 3) {
    score += 1;
    strengths.push("Good use of transitions");
  }

  const uniqueWords = new Set(words.map((w) => w.toLowerCase()));
  const diversity = words.length > 0 ? uniqueWords.size / words.length : 0;
  if (diversity > 0.6 && words.length > 30) {
    score += 1;
    strengths.push("Good vocabulary diversity");
  }

  score = clamp(score, 1, 10);

  const feedback =
    score >= 7
      ? "Clear, concise communication. Logical flow with smooth transitions."
      : score >= 5
        ? `Adequate clarity. ${weaknesses.length > 0 ? weaknesses[0] + "." : "Some improvements to conciseness would help."}`
        : `Communication lacks clarity. ${weaknesses[0] || "Confusing structure and excessive filler"}.`;

  return {
    id: "clarity",
    name: "Clarity",
    score,
    feedback,
    strengths,
    weaknesses,
  };
}

function scoreStructureAdherence(
  transcript: string,
  setterText: string,
): CategoryScore {
  const fullNorm = normalize(transcript);
  const totalLength = fullNorm.length;
  const firstThird = fullNorm.slice(0, Math.floor(totalLength / 3));
  const middleThird = fullNorm.slice(
    Math.floor(totalLength / 3),
    Math.floor((2 * totalLength) / 3),
  );
  const lastThird = fullNorm.slice(Math.floor((2 * totalLength) / 3));

  const strengths: string[] = [];
  const weaknesses: string[] = [];

  let score = 2;

  const stages = [
    {
      name: "Introduction",
      detected: hasAny(fullNorm, INTRO_PATTERNS),
      correctPosition: hasAny(firstThird, INTRO_PATTERNS),
    },
    {
      name: "Rapport/Context",
      detected: hasAny(fullNorm, [
        "people around here",
        "people here",
        "your neighborhood",
        "your area",
        "local",
        "community",
        "storms",
        "powerlines",
        "power lines",
        "a lot of people",
        "understand",
      ]),
      correctPosition: true,
    },
    {
      name: "Discovery/Questions",
      detected: getQuestions(setterText || transcript).length > 0,
      correctPosition: true,
    },
    {
      name: "Pain Discussion",
      detected: hasAny(fullNorm, [
        "bill",
        "rate",
        "increase",
        "expensive",
        "paying more",
        "cost",
        "frustrat",
      ]),
      correctPosition:
        hasAny(middleThird, PAIN_KEYWORDS) ||
        hasAny(lastThird, PAIN_KEYWORDS),
    },
    {
      name: "Value Proposition",
      detected: hasAny(fullNorm, [
        "cheaper",
        "save",
        "savings",
        "lower",
        "better option",
        "benefit",
        "reduce",
      ]),
      correctPosition: true,
    },
    {
      name: "Objection Handling",
      detected:
        hasAny(fullNorm, OBJECTION_PATTERNS) &&
        hasAny(fullNorm, ACKNOWLEDGE_PATTERNS),
      correctPosition: true,
    },
    {
      name: "Close/CTA",
      detected: hasAny(fullNorm, CLOSE_PATTERNS),
      correctPosition: hasAny(lastThird, CLOSE_PATTERNS),
    },
  ];

  const requiredStages = stages.filter(
    (s) => s.name !== "Objection Handling",
  );
  const requiredDetected = requiredStages.filter((s) => s.detected);

  if (requiredDetected.length >= 5) {
    score += 3;
    strengths.push(
      `${requiredDetected.length} of 6 key stages present`,
    );
  } else if (requiredDetected.length >= 3) {
    score += 2;
    strengths.push(`${requiredDetected.length} stages detected`);
  } else if (requiredDetected.length >= 1) {
    score += 1;
  } else {
    weaknesses.push("Missing most structural stages");
  }

  const hasIntroFirst = stages[0].detected && stages[0].correctPosition;
  const hasCloseLast = stages[6].detected && stages[6].correctPosition;

  if (hasIntroFirst) {
    score += 1;
    strengths.push("Opens with clear introduction");
  } else if (!stages[0].detected) {
    weaknesses.push("Missing introduction");
  }

  if (hasCloseLast) {
    score += 1;
    strengths.push("Ends with clear close/CTA");
  } else if (!stages[6].detected) {
    weaknesses.push("Missing close or call-to-action");
  }

  const stageCount = stages.filter((s) => s.detected).length;
  if (hasIntroFirst && hasCloseLast && stageCount >= 4) {
    score += 1;
    strengths.push("Logical progression from open to close");
  }

  const transitionPhrases = countMatches(fullNorm, [
    "exactly",
    "got it",
    "that's why",
    "thats why",
    "real quick",
  ]);
  if (transitionPhrases >= 3) {
    score += 1;
    strengths.push("Smooth transitions between stages");
  }

  if (!stages[0].detected && !stages[6].detected) {
    score -= 1;
    weaknesses.push("Missing both introduction and close");
  }

  score = clamp(score, 1, 10);

  const feedback =
    score >= 7
      ? `Well-structured pitch with smooth progression. ${stageCount} stages detected with proper sequencing.`
      : score >= 5
        ? `Basic structure present. ${stageCount} stages detected. ${weaknesses.length > 0 ? weaknesses[0] + "." : "Improve transitions between stages."}`
        : `Disorganized delivery. ${weaknesses[0] || "Missing major stages of expected pitch structure"}.`;

  return {
    id: "structure_adherence",
    name: "Structure Adherence",
    score,
    feedback,
    strengths,
    weaknesses,
  };
}

function computeMetrics(
  transcript: string,
  setterText: string,
): TranscriptMetrics {
  const analysisText = setterText || transcript;
  const words = getWords(analysisText);
  const sentences = getSentences(analysisText);
  const questions = getQuestions(analysisText);
  const openEnded = questions.filter(isOpenEndedQuestion);
  const norm = normalize(analysisText);

  const fillerCount = FILLER_WORDS.reduce((total, filler) => {
    const escaped = filler.replace(/\s+/g, "\\s+");
    const regex = new RegExp(`\\b${escaped}\\b`, "gi");
    return total + (norm.match(regex) || []).length;
  }, 0);

  return {
    wordCount: words.length,
    sentenceCount: sentences.length,
    questionCount: questions.length,
    openEndedQuestionCount: openEnded.length,
    fillerWordCount: fillerCount,
    avgWordsPerSentence:
      sentences.length > 0
        ? Math.round((words.length / sentences.length) * 10) / 10
        : 0,
  };
}

function buildSummary(
  overallScore: number,
  categories: CategoryScore[],
  metrics: TranscriptMetrics,
): string {
  if (metrics.wordCount === 0) {
    return "Paste or record a pitch transcript to generate an evaluation.";
  }

  const weakCategories = categories
    .filter((c) => c.score < 5)
    .map((c) => c.name.toLowerCase());
  const strongCategories = categories
    .filter((c) => c.score >= 7)
    .map((c) => c.name.toLowerCase());

  let summary: string;

  if (overallScore >= 8) {
    summary =
      "Elite performance. Pitch demonstrates mastery across most evaluation criteria.";
  } else if (overallScore >= 7) {
    summary = "Strong pitch with solid fundamentals.";
  } else if (overallScore >= 5) {
    summary = "Average performance with identifiable gaps.";
  } else if (overallScore >= 3) {
    summary =
      "Below average. Multiple categories need significant improvement.";
  } else {
    summary =
      "Weak performance across categories. Fundamental pitch structure and technique need rebuilding.";
  }

  if (weakCategories.length > 0) {
    summary += ` Weakest areas: ${weakCategories.slice(0, 3).join(", ")}.`;
  }
  if (strongCategories.length > 0) {
    summary += ` Strongest: ${strongCategories.slice(0, 2).join(", ")}.`;
  }

  if (metrics.wordCount < 50) {
    summary += " Transcript is short. Confidence in scoring is reduced.";
  }

  return summary;
}

const emptyCategory = (
  id: CategoryId,
  name: string,
): CategoryScore => ({
  id,
  name,
  score: 0,
  feedback: "No transcript to evaluate.",
  strengths: [],
  weaknesses: [],
});

export const evaluatePitch = (transcript: string): EvaluationResult => {
  if (!transcript.trim()) {
    return {
      overallScore: 0,
      categoryScores: [
        emptyCategory("objection_handling", "Objection Handling"),
        emptyCategory("question_quality", "Question Quality"),
        emptyCategory("value_proposition", "Value Proposition"),
        emptyCategory(
          "pain_point_identification",
          "Pain Point Identification",
        ),
        emptyCategory("clarity", "Clarity"),
        emptyCategory("structure_adherence", "Structure Adherence"),
      ],
      metrics: {
        wordCount: 0,
        sentenceCount: 0,
        questionCount: 0,
        openEndedQuestionCount: 0,
        fillerWordCount: 0,
        avgWordsPerSentence: 0,
      },
      summary:
        "Paste or record a pitch transcript to generate an evaluation.",
    };
  }

  const { setterText, prospectText } = parseDialogue(transcript);
  const analysisText = setterText || transcript;

  const categoryScores = [
    scoreObjectionHandling(transcript, setterText, prospectText),
    scoreQuestionQuality(transcript, analysisText),
    scoreValueProposition(transcript, analysisText),
    scorePainPointIdentification(
      transcript,
      analysisText,
      prospectText,
    ),
    scoreClarity(transcript, analysisText),
    scoreStructureAdherence(transcript, analysisText),
  ];

  const overallScore =
    Math.round(
      (categoryScores.reduce((sum, c) => sum + c.score, 0) /
        categoryScores.length) *
        10,
    ) / 10;

  const metrics = computeMetrics(transcript, analysisText);
  const summary = buildSummary(overallScore, categoryScores, metrics);

  return { overallScore, categoryScores, metrics, summary };
};
