import { Fragment, type ReactNode } from 'react';
import { DIFFICULTIES, type Difficulty } from '../engine/types';

/** Renders **bold** and line breaks from tutor/step text safely (no HTML injection). */
export function RichText({ text }: { text: string }) {
  return (
    <>
      {text.split('\n').map((line, i, arr) => (
        <Fragment key={i}>
          {line.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g).map((part, j) =>
            part.startsWith('**') && part.endsWith('**') ? (
              <strong key={j}>{part.slice(2, -2)}</strong>
            ) : part.startsWith('*') && part.endsWith('*') && part.length > 2 ? (
              <em key={j}>{part.slice(1, -1)}</em>
            ) : (
              <Fragment key={j}>{part}</Fragment>
            ),
          )}
          {i < arr.length - 1 && <br />}
        </Fragment>
      ))}
    </>
  );
}

/** Multi-line math shown in a highlighted "board". */
export function MathBlock({ math, highlight = true }: { math: string; highlight?: boolean }) {
  const lines = math.split('\n');
  return (
    <div className={`math-block${highlight ? ' highlight' : ''}`}>
      {lines.map((l, i) => (
        <div key={i} className={`math-line${i === lines.length - 1 && highlight ? ' current' : ''}`}>
          {l}
        </div>
      ))}
    </div>
  );
}

const LABELS: Record<Difficulty, string> = { easy: 'Easy', medium: 'Medium', hard: 'Hard', challenge: 'Challenge' };

export function DifficultyPicker({ value, onChange, label = 'Difficulty' }: { value: Difficulty; onChange: (d: Difficulty) => void; label?: string }) {
  return (
    <div className="segmented" role="radiogroup" aria-label={label}>
      {DIFFICULTIES.map((d) => (
        <button key={d} type="button" role="radio" aria-checked={value === d} className={value === d ? 'on' : ''} onClick={() => onChange(d)}>
          {LABELS[d]}
        </button>
      ))}
    </div>
  );
}

export function ProgressBar({ value, max, label }: { value: number; max: number; label: string }) {
  const pct = max ? Math.round((value / max) * 100) : 0;
  return (
    <div className="progress" role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={max} aria-valuenow={value} aria-valuetext={`${value} of ${max}`}>
      <div className="progress-fill" style={{ width: `${pct}%` }} />
    </div>
  );
}

export function Card({ title, icon, children, className = '', id, actions }: { title?: ReactNode; icon?: string; children: ReactNode; className?: string; id?: string; actions?: ReactNode }) {
  return (
    <section className={`card ${className}`} id={id} aria-labelledby={id && title ? `${id}-title` : undefined}>
      {(title || actions) && (
        <div className="card-head">
          {title && (
            <h2 id={id ? `${id}-title` : undefined}>
              {icon && (
                <span className="card-icon" aria-hidden="true">
                  {icon}
                </span>
              )}
              {title}
            </h2>
          )}
          {actions && <div className="card-actions">{actions}</div>}
        </div>
      )}
      {children}
    </section>
  );
}
