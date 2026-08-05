import type { SynapseKind, SynapseSnapshot, SynapseStimulation } from "./types";

export interface SynapseViewProps {
  snapshot: SynapseSnapshot;
  playing: boolean;
  kind: SynapseKind;
  stimulation: SynapseStimulation;
}

export function SynapseView({ snapshot, playing, kind, stimulation }: SynapseViewProps) {
  const movingCalcium = playing && snapshot.calciumEntering;
  const movingVesicles = playing && snapshot.vesiclesFusing;
  const movingTransmitters = playing && snapshot.transmitterReleased;
  const reverse = stimulation === "postsynaptic-reverse";
  const response = reverse
    ? "反向刺激不会激活突触前末梢"
    : kind === "excitatory"
      ? "兴奋性：突触后膜电位趋向升高"
      : "抑制性：突触后膜电位趋向降低";

  return (
    <section className="synapse-view-card" aria-labelledby="synapse-view-title">
      <h2 id="synapse-view-title" className="synapse-sr-only">化学突触动态视图</h2>
      <p className="synapse-direction">
        {reverse
          ? "反向刺激：不会由突触后膜传回突触前末梢"
          : "化学突触主要由突触前膜传向突触后膜"}
      </p>
      <div className="synapse-stage" role="img" aria-label={`化学突触示意图，当前${snapshot.stage}，${response}`}>
        <div className="synapse-presynaptic">
          <span className="synapse-membrane-name">突触前膜</span>
          <span className="synapse-channel">Ca²⁺通道</span>
          {[0, 1, 2].map((index) => <span className={`synapse-calcium ${movingCalcium ? "is-moving" : ""}`} key={index}>Ca²⁺</span>)}
          {[0, 1, 2].map((index) => <span className={`synapse-vesicle ${movingVesicles ? "is-fusing" : ""}`} key={index}>小泡</span>)}
        </div>
        <div className="synapse-cleft" aria-label="突触间隙">
          <span>突触间隙</span>
          {[0, 1, 2, 3].map((index) => <span className={`synapse-transmitter ${movingTransmitters ? "is-releasing" : ""}`} key={index}>递质</span>)}
        </div>
        <div className={`synapse-postsynaptic ${snapshot.receptorsActive ? "is-active" : ""} ${snapshot.postsynapticStimulated ? "is-reverse-stimulated" : ""}`}>
          <span className="synapse-membrane-name">突触后膜</span>
          {snapshot.stage === "reverse-stimulation" && <span className="synapse-reverse-pulse">反向刺激止于此处</span>}
          {[0, 1, 2, 3].map((index) => <span className="synapse-receptor" key={index}>受体</span>)}
          <strong>{snapshot.postsynapticMv} mV</strong>
        </div>
      </div>
      <p className="synapse-view-note">Ca²⁺、突触小泡和神经递质的运动仅在播放时显示；暂停时保留当前阶段的静态示意。</p>
    </section>
  );
}
