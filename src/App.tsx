import { useEffect, useMemo, useRef, useState } from "react";
import {
  BarChart3,
  CheckCircle2,
  ClipboardList,
  Mic,
  MicOff,
  Plus,
  RotateCcw,
  Sparkles,
  Trash2,
} from "lucide-react";
import { Criterion, defaultCriteria, gradePitch } from "./grading";

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

const samplePitch = `Thanks for meeting today. My goal is to understand your current sales process, the challenges slowing the team down, and what timeline matters for fixing it.

What challenge is most urgent for your team right now? How are you measuring ROI, and who else is involved in the decision? If we can reduce manual follow up and increase booked demos, your reps can spend more time with qualified buyers.

I understand budget is a concern; however, the value comes from saving time and reducing missed opportunities. The next step is to schedule a short demo with your sales manager this week, then I can send over a proposal.`;

const formatKeywords = (keywords: string[]) => keywords.join(", ");

const parseKeywords = (value: string) =>
  value
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);

const loadCriteria = () => {
  try {
    const stored = localStorage.getItem("sales-pitch-grader-criteria");
    if (!stored) return defaultCriteria;

    const parsed = JSON.parse(stored) as Criterion[];
    return Array.isArray(parsed) && parsed.length ? parsed : defaultCriteria;
  } catch {
    return defaultCriteria;
  }
};

const App = () => {
  const [transcript, setTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [criteria, setCriteria] = useState<Criterion[]>(loadCriteria);
  const [isRecording, setIsRecording] = useState(false);
  const [recorderMessage, setRecorderMessage] = useState(
    "Use your browser microphone or paste a completed pitch transcript.",
  );
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);

  const grade = useMemo(() => gradePitch(transcript, criteria), [criteria, transcript]);
  const speechSupported =
    typeof window !== "undefined" &&
    Boolean(window.SpeechRecognition || window.webkitSpeechRecognition);

  useEffect(() => {
    localStorage.setItem("sales-pitch-grader-criteria", JSON.stringify(criteria));
  }, [criteria]);

  useEffect(() => {
    return () => {
      recognitionRef.current?.stop();
    };
  }, []);

  const startRecording = () => {
    const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;

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

      for (let index = event.resultIndex; index < event.results.length; index += 1) {
        const result = event.results[index];
        if (result.isFinal) {
          finalText += `${result[0].transcript} `;
        } else {
          interimText += result[0].transcript;
        }
      }

      if (finalText) {
        setTranscript((current) => `${current}${current ? " " : ""}${finalText.trim()}`);
      }
      setInterimTranscript(interimText);
    };
    recognition.onerror = () => {
      setRecorderMessage("Recording stopped because the browser could not access audio.");
      setIsRecording(false);
    };
    recognition.onend = () => {
      setIsRecording(false);
      setInterimTranscript("");
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsRecording(true);
    setRecorderMessage("Recording in progress. Speak naturally; final text will appear below.");
  };

  const stopRecording = () => {
    recognitionRef.current?.stop();
    setIsRecording(false);
    setRecorderMessage("Recording stopped. Review the transcript and grading results.");
  };

  const updateCriterion = <Key extends keyof Criterion>(
    id: string,
    key: Key,
    value: Criterion[Key],
  ) => {
    setCriteria((current) =>
      current.map((criterion) =>
        criterion.id === id ? { ...criterion, [key]: value } : criterion,
      ),
    );
  };

  const addCriterion = () => {
    const nextNumber = criteria.length + 1;
    setCriteria((current) => [
      ...current,
      {
        id: `custom-${Date.now()}`,
        title: `Custom expectation ${nextNumber}`,
        expectation: "Describe the behavior or talk track you expect to hear.",
        weight: 10,
        keywords: ["example"],
      },
    ]);
  };

  const removeCriterion = (id: string) => {
    setCriteria((current) => current.filter((criterion) => criterion.id !== id));
  };

  const resetCriteria = () => setCriteria(defaultCriteria);

  return (
    <main className="app-shell">
      <section className="hero">
        <div>
          <p className="eyebrow">
            <Sparkles size={18} /> Sales pitch intelligence
          </p>
          <h1>Transcribe pitches and grade them against your playbook.</h1>
          <p className="hero-copy">
            Record a rep's talk track, paste a transcript, or use the sample pitch. The app
            scores each expectation from your custom rubric and turns missed points into coaching
            recommendations.
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
            <button className="ghost-button" type="button" onClick={() => setTranscript(samplePitch)}>
              Load sample pitch
            </button>
          </div>
          {!speechSupported && (
            <p className="browser-note">
              Your current browser may not support live Web Speech transcription. Pasting a
              transcript still works.
            </p>
          )}
        </div>

        <aside className="score-card">
          <span className="grade-label">Overall grade</span>
          <strong>{grade.letterGrade}</strong>
          <div className="score-ring" aria-label={`${grade.overallPercentage}%`}>
            {grade.overallPercentage}%
          </div>
          <p>
            {grade.overallScore} / {grade.totalPossible} rubric points
          </p>
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
            <button className="text-button" type="button" onClick={() => setTranscript("")}>
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
            <Metric label="Words" value={grade.metrics.wordCount} />
            <Metric label="Questions" value={grade.metrics.questionCount} />
            <Metric label="Filler words" value={grade.metrics.fillerCount} />
            <Metric label="Next step" value={grade.metrics.nextStepMentioned ? "Yes" : "No"} />
          </div>
        </div>

        <div className="panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">
                <ClipboardList size={16} /> Rubric
              </p>
              <h2>Set grading expectations</h2>
            </div>
            <div className="button-row">
              <button className="icon-button" type="button" onClick={resetCriteria} aria-label="Reset criteria">
                <RotateCcw size={16} />
              </button>
              <button className="icon-button" type="button" onClick={addCriterion} aria-label="Add criterion">
                <Plus size={16} />
              </button>
            </div>
          </div>
          <div className="criteria-list">
            {criteria.map((criterion) => (
              <article className="criterion-editor" key={criterion.id}>
                <div className="criterion-title-row">
                  <input
                    value={criterion.title}
                    onChange={(event) =>
                      updateCriterion(criterion.id, "title", event.target.value)
                    }
                    aria-label="Criterion title"
                  />
                  <button
                    className="icon-button danger"
                    type="button"
                    onClick={() => removeCriterion(criterion.id)}
                    aria-label={`Remove ${criterion.title}`}
                    disabled={criteria.length === 1}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                <label>
                  Expectation
                  <textarea
                    className="small-textarea"
                    value={criterion.expectation}
                    onChange={(event) =>
                      updateCriterion(criterion.id, "expectation", event.target.value)
                    }
                  />
                </label>
                <div className="criterion-grid">
                  <label>
                    Weight
                    <input
                      min="1"
                      type="number"
                      value={criterion.weight}
                      onChange={(event) =>
                        updateCriterion(
                          criterion.id,
                          "weight",
                          Math.max(1, Number(event.target.value) || 1),
                        )
                      }
                    />
                  </label>
                  <label>
                    Keywords or phrases
                    <input
                      value={formatKeywords(criterion.keywords)}
                      onChange={(event) =>
                        updateCriterion(
                          criterion.id,
                          "keywords",
                          parseKeywords(event.target.value),
                        )
                      }
                    />
                  </label>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">
              <BarChart3 size={16} /> Coaching report
            </p>
            <h2>Grading breakdown</h2>
          </div>
          <p className="muted">{grade.summary}</p>
        </div>

        <div className="results-grid">
          {grade.criterionScores.map((criterion) => (
            <article className="result-card" key={criterion.criterionId}>
              <div className="result-header">
                <div>
                  <h3>{criterion.title}</h3>
                  <p>{criterion.expectation}</p>
                </div>
                <strong>{criterion.percentage}%</strong>
              </div>
              <div className="progress-track">
                <span style={{ width: `${criterion.percentage}%` }} />
              </div>
              <p className="feedback">{criterion.feedback}</p>
              <div className="keyword-row">
                <KeywordList label="Heard" values={criterion.matchedKeywords} positive />
                <KeywordList label="Missing" values={criterion.missedKeywords} />
              </div>
            </article>
          ))}
        </div>

        <div className="recommendations">
          <h3>
            <CheckCircle2 size={18} /> Recommended coaching
          </h3>
          <ul>
            {grade.recommendations.map((recommendation) => (
              <li key={recommendation}>{recommendation}</li>
            ))}
          </ul>
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

type KeywordListProps = {
  label: string;
  values: string[];
  positive?: boolean;
};

const KeywordList = ({ label, values, positive = false }: KeywordListProps) => (
  <div>
    <span className="keyword-label">{label}</span>
    <div className="chips">
      {values.length ? (
        values.map((value) => (
          <span className={positive ? "chip positive" : "chip"} key={value}>
            {value}
          </span>
        ))
      ) : (
        <span className="empty-chip">None</span>
      )}
    </div>
  </div>
);

export default App;
