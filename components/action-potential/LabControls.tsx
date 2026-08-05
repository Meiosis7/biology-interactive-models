import type { StimulusIntensity } from "./types";

export interface LabControlsProps {
  time: number;
  duration: number;
  playing: boolean;
  intensity: StimulusIntensity;
  stimulusPosition: number;
  speed: 0.5 | 1;
  onTimeChange: (time: number) => void;
  onStart: () => void;
  onIntensityChange: (intensity: StimulusIntensity) => void;
  onStimulusPositionChange: (position: number) => void;
  onSpeedChange: (speed: 0.5 | 1) => void;
  onTogglePlaying: () => void;
  onStep: (delta: number) => void;
  onReset: () => void;
}

const INTENSITIES: Array<[StimulusIntensity, string]> = [
  ["weak", "弱刺激"], ["threshold", "阈刺激"], ["strong", "强刺激"],
];
const POSITIONS: Array<[number, string]> = [
  [0.1, "左侧刺激"], [0.5, "中部刺激"], [0.9, "右侧刺激"],
];

export function LabControls(props: LabControlsProps) {
  return (
    <section className="lab-controls" aria-label="实验控制台">
      <div className="control-groups">
        <fieldset className="control-group">
          <legend>刺激强度</legend>
          <div className="button-row">
            {INTENSITIES.map(([value, label]) => (
              <button className="control-button" key={value} aria-pressed={props.intensity === value} onClick={() => props.onIntensityChange(value)}>{label}</button>
            ))}
          </div>
        </fieldset>
        <fieldset className="control-group">
          <legend>刺激位置</legend>
          <div className="button-row">
            {POSITIONS.map(([value, label]) => (
              <button className="control-button" key={value} aria-pressed={props.stimulusPosition === value} onClick={() => props.onStimulusPositionChange(value)}>{label}</button>
            ))}
          </div>
        </fieldset>
        <fieldset className="control-group">
          <legend>动画速度</legend>
          <div className="button-row">
            <button className="control-button" aria-pressed={props.speed === 0.5} onClick={() => props.onSpeedChange(0.5)}>慢速</button>
            <button className="control-button" aria-pressed={props.speed === 1} onClick={() => props.onSpeedChange(1)}>正常</button>
          </div>
        </fieldset>
      </div>
      <label className="timeline-row">
        <span>实验时间</span>
        <input aria-label="实验时间" type="range" min="0" max={props.duration} step="0.1" value={props.time} onChange={(event) => props.onTimeChange(Number(event.target.value))} />
        <output>{props.time.toFixed(1)} s</output>
      </label>
      <div className="button-row transport-row">
        <button className="control-button primary" onClick={props.onStart}>开始刺激</button>
        <button className="control-button" onClick={props.onTogglePlaying}>{props.playing ? "暂停" : "播放"}</button>
        <button className="control-button" onClick={() => props.onStep(-0.5)}>上一步</button>
        <button className="control-button" onClick={() => props.onStep(0.5)}>下一步</button>
        <button className="control-button" onClick={props.onReset}>重置</button>
      </div>
    </section>
  );
}
