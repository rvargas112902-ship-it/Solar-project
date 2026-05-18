import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  Mic,
  MicOff,
  Sparkles,
  Target,
} from "lucide-react";
import { evaluatePitch, CategoryScore } from "./grading";

type SpeechRecognitionResultItem = {
  transcript: string;
};

type SpeechRecognitionResult = {
  isFinal: boolean;
  0: SpeechRecognitionResultItem;
};

type SpeechRecognitionResultList = {
  length: number;
  [index: number]: SpeechRecognitionResult;
};

type SpeechRecognitionEvent = {
  resultIndex: number;
  results: SpeechRecognitionResultList;
};

type SpeechRecognitionLike = {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
  start: () => void;
  stop: () => void;
};

type SpeechRecognitionConstructor = new () => SpeechRecognitionLike;

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  }
}

const samplePitch = `Setter: Hey listen, I don't have much time. Do you see these powerlines here?

Homeowner: Yeah.

Setter: They're going underground because of the storm outages. That way if something major happens again, the area has more reliable power. Does that make sense?

Homeowner: Yeah, we lost power for two days.

Setter: Exactly, a lot of people around here did. The frustrating part is Duke is increasing rates to pay for all that infrastructure, so people are paying more for the same amount of power.

Homeowner: Yeah, our bill has definitely gone up.

Setter: That's why I stopped. If we can get you the power you're already using from Duke for significantly cheaper, we'll show you exactly what it looks like. Most neighbors are only paying $35-$40, so we probably can't help them. What's the lowest your Duke bill gets?

Homeowner: $180 on the low end.

Setter: Got it. And if I can't even save you money and it ends up costing more, what are you going to tell me?

Homeowner: No.

Setter: Exactly. What I look at is the squiggly line on your bill. It tells me how much power you are pulling annually and lets me know if I can save you money. Do you get this online or paper?`;

const getScoreClass = (score: number): string => {
  if (score >= 8) return "score-elite";
  if (score >= 6) return "score-good";
  if (score >= 4) return "score-mid";
  return "score-low";
};

const getOverallLabel = (score: number): string => {
  if (score === 0) return "N/A";
  if (score >= 8) return "Elite";
  if (score >= 7) return "Strong";
  if (score >= 5) return "Average";
  if (score >= 3) return "Below Avg";
  return "Weak";
};

const App = () => {
  const [transcript, setTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [recorderMessage, setRecorderMessage] = useState(
    "Use your browser microphone or paste a completed pitch transcript.",
  );
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);

  const evaluation = useMemo(() => evaluatePitch(transcript), [transcript]);
  const speechSupported =
    typeof window !== "undefined" &&
    Boolean(window.SpeechRecognition || window.webkitSpeechRecognition);

  useEffect(() => {
    return () => {
      recognitionRef.current?.stop();
    };
  }, []);

  const startRecording = () => {
    const Recognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!Recognition) {
      setRecorderMessage(
        "Speech recognition is not available in this browser. Paste a transcript instead.",
      );
      return;
    }

    const recognition = new Recognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";
    recognition.onresult = (event) => {
      let finalText = "";
      let interimText = "";

      for (
        let index = event.resultIndex;
        index < event.results.length;
        index += 1
      ) {
        const result = event.results[index];
        if (result.isFinal) {
          finalText += `${result[0].transcript} `;
        } else {
          interimText += result[0].transcript;
        }
      }

      if (finalText) {
        setTranscript(
          (current) =>
            `${current}${current ? " " : ""}${finalText.trim()}`,
        );
      }
      setInterimTranscript(interimText);
    };
    recognition.onerror = () => {
      setRecorderMessage(
        "Recording stopped because the browser could not access audio.",
      );
      setIsRecording(false);
    };
    recognition.onend = () => {
      setIsRecording(false);
      setInterimTranscript("");
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsRecording(true);
    setRecorderMessage(
      "Recording in progress. Speak naturally; final text will appear below.",
    );
  };

  const stopRecording = () => {
    recognitionRef.current?.stop();
    setIsRecording(false);
    setRecorderMessage(
      "Recording stopped. Review the transcript and evaluation results.",
    );
  };

  return (
    <main className="app-shell">
      <section className="hero">
        <div>
          <p className="eyebrow">
            <Sparkles size={18} /> Elite pitch evaluator
          </p>
          <h1>Grade appointment setter pitches with precision.</h1>
          <p className="hero-copy">
            Paste a transcript, record live, or load the sample door pitch. The
            evaluator scores 6 categories on a strict 1-10 scale and returns
            concise, analytical feedback.
          </p>
          <div className="hero-actions">
            <button
              className="primary-button"
              type="button"
              onClick={isRecording ? stopRecording : startRecording}
            >
              {isRecording ? <MicOff size={18} /> : <Mic size={18} />}
              {isRecording ? "Stop recording" : "Start transcription"}
            </button>
            <button
              className="ghost-button"
              type="button"
              onClick={() => setTranscript(samplePitch)}
            >
              Load sample pitch
            </button>
          </div>
          {!speechSupported && (
            <p className="browser-note">
              Your current browser may not support live Web Speech
              transcription. Pasting a transcript still works.
            </p>
          )}
        </div>

        <aside className="score-card">
          <span className="grade-label">Overall score</span>
          <strong className={getScoreClass(evaluation.overallScore)}>
            {evaluation.overallScore || "—"}
          </strong>
          <div className="score-denominator">/ 10</div>
          <span className={`overall-label ${getScoreClass(evaluation.overallScore)}`}>
            {getOverallLabel(evaluation.overallScore)}
          </span>
        </aside>
      </section>

      <section className="workspace-grid">
        <div className="panel transcript-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">
                <Mic size={16} /> Transcript
              </p>
              <h2>Capture the pitch</h2>
            </div>
            <button
              className="text-button"
              type="button"
              onClick={() => setTranscript("")}
            >
              Clear
            </button>
          </div>
          <p className="muted">{recorderMessage}</p>
          <textarea
            value={transcript}
            onChange={(event) => setTranscript(event.target.value)}
            placeholder="Paste or record the salesperson's pitch here..."
          />
          {interimTranscript && (
            <p className="interim">
              <strong>Live:</strong> {interimTranscript}
            </p>
          )}
          <div className="metric-grid">
            <Metric label="Words" value={evaluation.metrics.wordCount} />
            <Metric label="Questions" value={evaluation.metrics.questionCount} />
            <Metric
              label="Open-ended"
              value={evaluation.metrics.openEndedQuestionCount}
            />
            <Metric
              label="Filler words"
              value={evaluation.metrics.fillerWordCount}
            />
          </div>
        </div>

        <div className="panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">
                <Target size={16} /> Category scores
              </p>
              <h2>Evaluation overview</h2>
            </div>
          </div>
          <div className="score-bars">
            {evaluation.categoryScores.map((cat) => (
              <ScoreBar key={cat.id} category={cat} />
            ))}
          </div>
        </div>
      </section>

      <section className="panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">
              <BarChart3 size={16} /> Detailed evaluation
            </p>
            <h2>Category breakdown</h2>
          </div>
          <p className="muted">{evaluation.summary}</p>
        </div>

        <div className="results-grid">
          {evaluation.categoryScores.map((cat) => (
            <CategoryCard key={cat.id} category={cat} />
          ))}
        </div>
      </section>
    </main>
  );
};

type MetricProps = {
  label: string;
  value: number | string;
};

const Metric = ({ label, value }: MetricProps) => (
  <div className="metric-card">
    <span>{label}</span>
    <strong>{value}</strong>
  </div>
);

type ScoreBarProps = {
  category: CategoryScore;
};

const ScoreBar = ({ category }: ScoreBarProps) => (
  <div className="score-bar-item">
    <div className="score-bar-header">
      <span className="score-bar-name">{category.name}</span>
      <strong className={getScoreClass(category.score)}>
        {category.score}
        <span className="score-max">/10</span>
      </strong>
    </div>
    <div className="score-bar-track">
      <span
        className={getScoreClass(category.score)}
        style={{ width: `${category.score * 10}%` }}
      />
    </div>
  </div>
);

type CategoryCardProps = {
  category: CategoryScore;
};

const CategoryCard = ({ category }: CategoryCardProps) => (
  <article className="result-card">
    <div className="result-header">
      <div>
        <h3>{category.name}</h3>
      </div>
      <strong className={getScoreClass(category.score)}>
        {category.score}
      </strong>
    </div>
    <div className="progress-track">
      <span
        className={getScoreClass(category.score)}
        style={{ width: `${category.score * 10}%` }}
      />
    </div>
    <p className="feedback">{category.feedback}</p>
    {category.strengths.length > 0 && (
      <div className="finding-list">
        <span className="finding-label positive">
          <CheckCircle2 size={13} /> Strengths
        </span>
        <ul>
          {category.strengths.map((s) => (
            <li key={s} className="finding-positive">
              {s}
            </li>
          ))}
        </ul>
      </div>
    )}
    {category.weaknesses.length > 0 && (
      <div className="finding-list">
        <span className="finding-label negative">
          <AlertTriangle size={13} /> Weaknesses
        </span>
        <ul>
          {category.weaknesses.map((w) => (
            <li key={w} className="finding-negative">
              {w}
            </li>
          ))}
        </ul>
      </div>
    )}
  </article>
);

export default App;
