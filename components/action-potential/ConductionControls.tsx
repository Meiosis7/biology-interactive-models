import type { ConductionStep } from "./types";

interface ConductionControlsProps {
  step: ConductionStep;
  busy: boolean;
  complete: boolean;
  onNext: () => void;
  onReplay: () => void;
}

export function ConductionControls({
  step,
  busy,
  complete,
  onNext,
  onReplay,
}: ConductionControlsProps) {
  const status = busy
    ? "本步动画播放中"
    : complete
      ? "传导演示完成"
      : `当前第${step + 1}步，共7步`;

  return (
    <section className="ap-controls" aria-label="传导步骤控制">
      <button
        type="button"
        className="ap-control ap-control--primary"
        disabled={busy || complete}
        onClick={onNext}
      >
        下一步
      </button>
      <button type="button" className="ap-control" onClick={onReplay}>
        重新演示
      </button>
      <p aria-live="polite">{status}</p>
    </section>
  );
}
