import type { ReactNode } from "react";

export interface NeuralLearningGuideProps {
  goal: string;
  steps: readonly [string, string, string];
  currentStep: number;
  takeaway: string;
}

export function NeuralLearningGuide({
  goal,
  steps,
  currentStep,
  takeaway,
}: NeuralLearningGuideProps) {
  return (
    <section className="neural-guide" aria-label="基础引导">
      <p className="neural-guide__eyebrow">基础引导</p>
      <h2>本页只需看懂：{goal}</h2>
      <ol>
        {steps.map((step, index) => (
          <li
            key={step}
            aria-current={index === currentStep ? "step" : undefined}
          >
            <span>{index + 1}</span>
            {step}
          </li>
        ))}
      </ol>
      <p className="neural-guide__takeaway">一句话结论：{takeaway}</p>
    </section>
  );
}

export interface AdvancedPanelProps {
  id: string;
  expanded: boolean;
  onExpandedChange: (expanded: boolean) => void;
  children: ReactNode;
}

export function AdvancedPanel({
  id,
  expanded,
  onExpandedChange,
  children,
}: AdvancedPanelProps) {
  return (
    <section className="advanced-panel" aria-label="进阶模式">
      <button
        className="advanced-panel__toggle"
        type="button"
        aria-expanded={expanded}
        aria-controls={id}
        onClick={() => onExpandedChange(!expanded)}
      >
        {expanded ? "收起进阶模式" : "打开进阶模式"}
      </button>
      {expanded && (
        <div className="advanced-panel__content" id={id}>
          {children}
        </div>
      )}
    </section>
  );
}
