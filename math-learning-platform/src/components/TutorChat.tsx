import { useEffect, useId, useMemo, useRef, useState } from 'react';
import type { Visual } from '../engine/types';
import { useProgress } from '../progress/store';
import { listen, sttSupported } from '../speech/speech';
import { createTutor, type ChatTurn, type TutorAction, type TutorContext } from '../tutor/tutor';
import { RichText } from './ui';
import { VisualRenderer } from './visuals/Visuals';

interface Msg extends ChatTurn {
  visual?: Visual;
  suggestions?: string[];
}

interface Props {
  context: TutorContext;
  onAction?: (a: TutorAction) => void;
  compact?: boolean;
}

/** Conversational tutor that teaches with hints and explanations, not answers. */
export function TutorChat({ context, onAction, compact }: Props) {
  const tutor = useMemo(() => createTutor(), []);
  const progress = useProgress();
  const [messages, setMessages] = useState<Msg[]>(() => [
    {
      role: 'tutor',
      text: `Hi${progress.state.profile.name ? ` ${progress.state.profile.name}` : ''}! 👋 I’m your math tutor. Ask me anything about this lesson — I’ll help you understand it step by step (I won’t just hand you answers 😉).`,
      suggestions: [
        context.problem?.steps[1] ? `Why do we “${context.problem.steps[1].title.toLowerCase()}”?` : 'Why does this work?',
        'I don’t understand step 2',
        `Explain this like I’m in grade ${Math.max(1, context.grade - 2)}`,
        'Give me an easier problem',
      ],
    },
  ]);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [listening, setListening] = useState(false);
  const logRef = useRef<HTMLDivElement>(null);
  const inputId = useId();

  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const send = async (raw: string) => {
    const q = raw.trim();
    if (!q || busy) return;
    setText('');
    const history = [...messages, { role: 'student' as const, text: q }];
    setMessages(history);
    setBusy(true);
    progress.countTutorQuestion();
    const reply = await tutor.reply(q, context, history);
    setMessages((m) => [...m, { role: 'tutor', text: reply.text, visual: reply.visual, suggestions: reply.suggestions }]);
    setBusy(false);
    if (reply.action) onAction?.(reply.action);
  };

  const mic = () => {
    setListening(true);
    listen(
      (t) => send(t),
      () => setListening(false),
    );
  };

  const last = messages[messages.length - 1];

  return (
    <div className={`tutor${compact ? ' compact' : ''}`}>
      <div className="tutor-head">
        <span className="tutor-avatar" aria-hidden="true">
          🦉
        </span>
        <div>
          <strong>AI Math Tutor</strong>
          <div className="small muted">{tutor.name} · hints first, answers last</div>
        </div>
      </div>
      <div className="tutor-log" ref={logRef} role="log" aria-live="polite" aria-label="Tutor conversation">
        {messages.map((m, i) => (
          <div key={i} className={`bubble from-${m.role}`}>
            <span className="sr-only">{m.role === 'tutor' ? 'Tutor says:' : 'You said:'}</span>
            <RichText text={m.text} />
            {m.visual && <VisualRenderer visual={m.visual} />}
          </div>
        ))}
        {busy && (
          <div className="bubble from-tutor typing" aria-label="Tutor is typing">
            <span />
            <span />
            <span />
          </div>
        )}
      </div>
      {last.role === 'tutor' && last.suggestions && (
        <div className="chips" aria-label="Suggested questions">
          {last.suggestions.map((s) => (
            <button key={s} type="button" className="chip" onClick={() => send(s)}>
              {s}
            </button>
          ))}
        </div>
      )}
      <form
        className="tutor-input"
        onSubmit={(e) => {
          e.preventDefault();
          send(text);
        }}
      >
        <label htmlFor={inputId} className="sr-only">
          Ask the tutor a question
        </label>
        <input id={inputId} value={text} onChange={(e) => setText(e.target.value)} placeholder="Ask: Why did we divide by 3?" autoComplete="off" />
        {sttSupported() && (
          <button type="button" className="btn icon" onClick={mic} aria-pressed={listening} aria-label="Ask by voice" title="Ask by voice">
            {listening ? '🔴' : '🎤'}
          </button>
        )}
        <button type="submit" className="btn primary" disabled={!text.trim() || busy}>
          Ask
        </button>
      </form>
    </div>
  );
}
