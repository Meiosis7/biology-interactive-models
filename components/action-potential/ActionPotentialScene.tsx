import type { ActionPotentialFrame, ActionPotentialMode } from "./types";

const MODE_LABELS: Record<ActionPotentialMode, string> = {
  resting: "静息电位",
  generation: "动作电位产生",
  conduction: "动作电位传导",
};

interface ActionPotentialSceneProps {
  mode: ActionPotentialMode;
  frame: ActionPotentialFrame;
  playing: boolean;
}

export function ActionPotentialScene({
  mode,
  frame,
  playing,
}: ActionPotentialSceneProps) {
  return (
    <section
      className={`ap-scene ap-scene--${mode}`}
      data-phase={frame.phase}
      data-playing={playing}
      aria-label={`${MODE_LABELS[mode]}动态示意`}
    >
      <div className="ap-diagram-heading">
        <span>{MODE_LABELS[mode]}</span>
        <b>
          {mode === "resting"
            ? "外正内负"
            : mode === "generation"
              ? "局部外负内正"
              : "双向传导"}
        </b>
      </div>

      <p className="ap-phase-caption" aria-live="polite">
        {frame.instruction}
      </p>

      <div className="ap-fiber-stage">
        <span className="ap-compartment-label ap-compartment-label--outside">
          膜外
        </span>
        <span className="ap-compartment-label ap-compartment-label--inside">
          膜内
        </span>

        <div className="ap-fiber" data-testid="shared-fiber">
          {frame.segments.map((segment) => (
            <div
              key={segment.id}
              className={`ap-membrane-segment ap-membrane-segment--${segment.polarity}`}
              data-segment-id={segment.id}
              data-segment-polarity={segment.polarity}
              data-current-target={segment.currentTarget}
              aria-label={`第${segment.id + 1}膜段${segment.polarity === "excited" ? "外负内正" : "外正内负"}`}
            >
              <span className="ap-segment-charge ap-segment-charge--outside">
                {segment.polarity === "excited" ? "−" : "+"}
              </span>
              <i
                className="ap-gated-channel ap-gated-channel--na"
                data-channel-species="sodium"
                data-open={segment.sodiumChannelOpen}
                aria-label={`第${segment.id + 1}膜段Na⁺通道${segment.sodiumChannelOpen ? "开放" : "关闭"}`}
              />
              <span className="ap-segment-charge ap-segment-charge--inside">
                {segment.polarity === "excited" ? "+" : "−"}
              </span>
              {segment.sodiumInflux && (
                <span
                  className="ap-segment-na-flow"
                  aria-label={`Na⁺进入第${segment.id + 1}膜段`}
                >
                  Na⁺↓
                </span>
              )}
              {mode === "resting" && segment.id === 1 && (
                <>
                  <i
                    className="ap-gated-channel ap-gated-channel--k"
                    data-channel-species="potassium"
                    data-open={frame.potassiumChannelOpen}
                    aria-label={`K⁺通道${frame.potassiumChannelOpen ? "开放" : "关闭"}`}
                  />
                  {frame.potassiumOutflow && (
                    <span className="ap-segment-k-flow" aria-label="K⁺外流">
                      K⁺↑
                    </span>
                  )}
                </>
              )}
              {frame.stimulusVisible && segment.id === 3 && (
                <i className="ap-stimulus" aria-label="刺激点">
                  <span>刺激</span>
                </i>
              )}
            </div>
          ))}

          {frame.localCurrentStep !== null && (
            <div
              className="ap-local-current-system"
              data-current-step={frame.localCurrentStep}
              aria-label="局部电流方向"
            >
              <div
                className="ap-current-row ap-current-row--outside"
                aria-label="膜外局部电流返回兴奋区"
              >
                <span>→</span>
                <b>膜外回流</b>
                <span>←</span>
              </div>
              <div
                className="ap-current-row ap-current-row--inside"
                aria-label="膜内局部电流向两侧未兴奋区"
              >
                <span>←</span>
                <b>膜内局部电流</b>
                <span>→</span>
              </div>
            </div>
          )}
        </div>

        {mode === "conduction" && (
          <div className="ap-region-labels">
            <span>未兴奋区</span>
            <b>兴奋区</b>
            <span>未兴奋区</span>
          </div>
        )}
        {mode === "conduction" && (
          <p className="ap-bidirectional">兴奋由刺激点向两侧逐段传导</p>
        )}
      </div>
    </section>
  );
}
