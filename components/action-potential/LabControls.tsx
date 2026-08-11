interface LabControlsProps {
  playing: boolean;
  playbackDisabled?: boolean;
  onTogglePlaying: () => void;
  onReplay: () => void;
}

export function LabControls({
  playing,
  playbackDisabled = false,
  onTogglePlaying,
  onReplay,
}: LabControlsProps) {
  return (
    <section className="ap-controls" aria-label="动画控制">
      <button
        type="button"
        className="ap-control ap-control--primary"
        disabled={playbackDisabled}
        onClick={onTogglePlaying}
      >
        {playing ? "暂停" : "播放"}
      </button>
      <button
        type="button"
        className="ap-control"
        disabled={playbackDisabled}
        onClick={onReplay}
      >
        重新播放
      </button>
    </section>
  );
}
