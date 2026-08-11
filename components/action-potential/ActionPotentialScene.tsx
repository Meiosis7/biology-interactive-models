import type { ActionPotentialFrame, ActionPotentialMode } from "./types";
import { IonChannel } from "./IonChannel";
import { IonStream } from "./IonStream";
import { LocalCurrentFlow } from "./LocalCurrentFlow";

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
  const conductionComplete =
    mode === "conduction" &&
    frame.segments.every((segment) => segment.polarity === "excited");

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
              {(
                [
                  "outside-top",
                  "inside-top",
                  "inside-bottom",
                  "outside-bottom",
                ] as const
              ).map((position) => {
                const outside = position.startsWith("outside");
                const positive =
                  segment.polarity === "resting" ? outside : !outside;
                return (
                  <span
                    key={position}
                    className={`ap-segment-charge ap-segment-charge--${position}`}
                    data-charge-position={position}
                    aria-hidden="true"
                  >
                    {positive ? "＋" : "−"}
                  </span>
                );
              })}
              <IonChannel
                species="sodium"
                open={segment.sodiumChannelOpen}
                label={`第${segment.id + 1}膜段Na⁺通道${segment.sodiumChannelOpen ? "开放" : "关闭"}`}
              />
              {segment.sodiumInflux && (
                <IonStream
                  species="sodium"
                  direction="inward"
                  label={`Na⁺进入第${segment.id + 1}膜段`}
                />
              )}
              {mode === "resting" && segment.id === 1 && (
                <>
                  <IonChannel
                    species="potassium"
                    open={frame.potassiumChannelOpen}
                    label={`K⁺通道${frame.potassiumChannelOpen ? "开放" : "关闭"}`}
                  />
                  {frame.potassiumOutflow && (
                    <IonStream
                      species="potassium"
                      direction="outward"
                      label="K⁺外流"
                    />
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
            >
              <LocalCurrentFlow step={frame.localCurrentStep} />
            </div>
          )}
        </div>

        {mode === "conduction" && (
          <div className="ap-region-labels">
            {conductionComplete ? (
              <b>全部膜段已兴奋</b>
            ) : (
              <>
                <span>未兴奋区</span>
                <b>兴奋区</b>
                <span>未兴奋区</span>
              </>
            )}
          </div>
        )}
        {mode === "conduction" && (
          <p className="ap-bidirectional">兴奋由刺激点向两侧逐段传导</p>
        )}
      </div>
    </section>
  );
}
