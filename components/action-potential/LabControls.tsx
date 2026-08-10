interface LabControlsProps {
  playing: boolean;
  onTogglePlaying: () => void;
  onReplay: () => void;
}

export function LabControls({
  playing,
  onTogglePlaying,
  onReplay,
}: LabControlsProps) {
  return (
    <section className="ap-controls" aria-label="动画控制">
      <button
        type="button"
        className="ap-control ap-control--primary"
        onClick={onTogglePlaying}
      >
        {playing ? "暂停" : "播放"}
      </button>
      <button type="button" className="ap-control" onClick={onReplay}>
        重新播放
      </button>
      <p>离子、通道和传导方向均为教学示意。</p>
    </section>
  );
}
