import type { StimulusIntensity } from "./types";
import { AdvancedPanel } from "../neural-guidance/NeuralLearningGuide";

export interface LabControlsProps {
  time: number;
  duration: number;
  playing: boolean;
  intensity: StimulusIntensity;
  stimulusPosition: number;
  speed: 0.5 | 1;
  advanced: boolean;
  onTimeChange: (time: number) => void;
  onStart: () => void;
  onIntensityChange: (intensity: StimulusIntensity) => void;
  onStimulusPositionChange: (position: number) => void;
  onSpeedChange: (speed: 0.5 | 1) => void;
  onAdvancedChange: (expanded: boolean) => void;
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
      <div className="button-row transport-row">
        <button className="control-button primary" onClick={props.onStart}>开始刺激</button>
        <button className="control-button" onClick={props.onTogglePlaying}>{props.playing ? "暂停" : "播放"}</button>
        <button className="control-button" disabled={props.time <= 0} onClick={() => props.onStep(-0.5)}>上一步</button>
        <button className="control-button" disabled={props.time >= props.duration} onClick={() => props.onStep(0.5)}>下一步</button>
        <button className="control-button" onClick={props.onReset}>重置</button>
      </div>
      <AdvancedPanel id="action-potential-advanced" expanded={props.advanced} onExpandedChange={props.onAdvancedChange}>
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
          <span>教学时间</span>
          <input aria-label="教学时间" aria-valuetext={`${props.time.toFixed(1)} 时间单位`} type="range" min="0" max={props.duration} step="0.1" value={props.time} onChange={(event) => props.onTimeChange(Number(event.target.value))} />
          <output>{props.time.toFixed(1)} 时间单位</output>
        </label>
      </AdvancedPanel>
      <p className="schematic-note">动画时间和传播速度均为教学示意，不对应真实生理秒数。</p>
    </section>
  );
}
