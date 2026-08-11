interface ConductionControlsProps {
  busy: boolean;
  complete: boolean;
  onNext: () => void;
  onReplay: () => void;
}

export function ConductionControls({
  busy,
  complete,
  onNext,
  onReplay,
}: ConductionControlsProps) {
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
    </section>
  );
}
