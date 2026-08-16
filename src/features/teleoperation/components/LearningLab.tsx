import { useState } from "react";
import { ChevronDown, MessageSquareQuote } from "lucide-react";

const questions = [
  {
    question: "A command arrives 800 ms after it was created. What should the edge computer consider doing?",
    answers: ["Execute it immediately", "Reject it because it is too old", "Store it forever", "Restart Mission Control"],
    correct: 1,
    why: "The operator may have sent a newer command since then. Executing the old one could move the machine in the wrong direction.",
  },
  {
    question: "Average latency is 70 ms, but jitter is 250 ms. Why can control still feel bad?",
    answers: ["Commands arrive at an uneven pace", "The engine uses more fuel", "GPS stops working", "Every packet is duplicated"],
    correct: 0,
    why: "The delay keeps changing. The operator cannot predict when the machine will respond.",
  },
  {
    question: "The network disappears while the machine is moving. Where should the immediate safety response happen?",
    answers: ["On the machine", "In a remote database", "In the operator's browser only", "At the internet provider"],
    correct: 0,
    why: "The machine can no longer depend on a message from Mission Control. Local logic is still there when the link is gone.",
  },
];

export function LearningLab() {
  const [questionIndex, setQuestionIndex] = useState(0);
  const [answer, setAnswer] = useState<number | null>(null);
  const question = questions[questionIndex];
  return (
    <section className="learning-grid">
      <div className="panel quiz-card">
        <div className="panel-heading"><div><span className="eyebrow">CHECK YOUR THINKING</span><h2>What would you do?</h2></div><span className="count-chip">{questionIndex + 1} / {questions.length}</span></div>
        <p className="quiz-question">{question.question}</p>
        <div className="quiz-answers">
          {question.answers.map((item, index) => <button className={answer === null ? "" : index === question.correct ? "correct" : answer === index ? "wrong" : ""} disabled={answer !== null} onClick={() => setAnswer(index)} key={item}>{item}</button>)}
        </div>
        {answer !== null && <div className={`quiz-result ${answer === question.correct ? "right" : "try-again"}`}><strong>{answer === question.correct ? "Good call." : "Not this time."}</strong> {question.why}<button onClick={() => { setQuestionIndex((questionIndex + 1) % questions.length); setAnswer(null); }}>Next question →</button></div>}
      </div>

      <div className="panel freshness-card">
        <span className="eyebrow">RELIABILITY VS FRESHNESS</span><h2>Which position update helps more?</h2>
        <div className="message-compare">
          <div><span>MESSAGE A</span><strong>Every update arrives</strong><b>900 ms late</b></div>
          <div className="preferred"><span>MESSAGE B</span><strong>One update is dropped</strong><b>next update in 50 ms</b></div>
        </div>
        <p>For a moving machine, the newest state can matter more than receiving every old state.</p>
      </div>

      <details className="panel interview-card">
        <summary><span><MessageSquareQuote /> Interview takeaway</span><ChevronDown /></summary>
        <div>
          <p>“In teleoperation, I care about the full feedback loop, not just how long one command takes to reach the machine.”</p>
          <p>“Commands need timestamps or sequence numbers so the machine can ignore old instructions.”</p>
          <p>“Immediate safety behavior should run locally instead of depending on a remote service.”</p>
        </div>
      </details>
    </section>
  );
}
