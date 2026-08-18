import { Fragment } from "react";
import type { ActionPotentialFrame, ActionPotentialMode } from "./types";
import { IonChannel } from "./IonChannel";
import { IonDistribution } from "./IonDistribution";
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
  animationEpoch?: number;
}

export function ActionPotentialScene({
  mode,
  frame,
  playing,
  animationEpoch = 0,
}: ActionPotentialSceneProps) {
  const allSegmentsExcited =
    mode === "conduction" &&
    frame.segments.every((segment) => segment.polarity === "excited");
  const conductionComplete = mode === "conduction" && frame.phase === "conducted";

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
              ? "局部膜外为负、膜内为正"
              : "双向传导"}
        </b>
      </div>

      {!conductionComplete && (
        <p className="ap-phase-caption" aria-live={playing ? "off" : "polite"}>
          {frame.instruction}
        </p>
      )}

      <div className="ap-fiber-stage">
        {([
          ["outside-top", "膜外"],
          ["inside", "膜内"],
          ["outside-bottom", "膜外"],
        ] as const).map(([compartment, label]) => (
          <span
            key={compartment}
            className={`ap-compartment-label ap-compartment-label--${compartment}`}
            data-testid="membrane-compartment-label"
            data-compartment={compartment}
          >
            {label}
          </span>
        ))}

        <div className="ap-fiber" data-testid="shared-fiber">
          <IonDistribution />
          {frame.segments.map((segment) => (
            <div
              key={segment.id}
              className={`ap-membrane-segment ap-membrane-segment--${segment.polarity}`}
              role="group"
              data-segment-id={segment.id}
              data-segment-polarity={segment.polarity}
              data-current-target={segment.currentTarget}
              aria-label={`第${segment.id + 1}膜段${segment.polarity === "excited" ? "膜外为负、膜内为正" : "外正内负"}`}
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
              {(["top", "bottom"] as const).map((surface) => (
                <Fragment key={`sodium-${surface}`}>
                  <IonChannel
                    species="sodium"
                    surface={surface}
                    open={segment.sodiumChannelOpen}
                    label={`第${segment.id + 1}膜段${surface === "top" ? "上膜" : "下膜"} Na⁺通道${segment.sodiumChannelOpen ? "开放" : "关闭"}`}
                  />
                  {segment.sodiumInflux && (
                    <IonStream
                      key={`sodium-stream-${surface}-${animationEpoch}`}
                      species="sodium"
                      surface={surface}
                      direction="inward"
                      label={`Na⁺经第${segment.id + 1}膜段${surface === "top" ? "上膜" : "下膜"}进入膜内`}
                    />
                  )}
                </Fragment>
              ))}
              {mode === "resting" && segment.id === 1 && (
                (["top", "bottom"] as const).map((surface) => (
                  <Fragment key={`potassium-${surface}`}>
                    <IonChannel
                      species="potassium"
                      surface={surface}
                      open={frame.potassiumChannelOpen}
                      label={`${surface === "top" ? "上膜" : "下膜"} K⁺通道${frame.potassiumChannelOpen ? "开放" : "关闭"}`}
                    />
                    {frame.potassiumOutflow && (
                      <IonStream
                        key={`potassium-stream-${surface}-${animationEpoch}`}
                        species="potassium"
                        surface={surface}
                        direction="outward"
                        label={`K⁺经${surface === "top" ? "上膜" : "下膜"}向膜外流出`}
                      />
                    )}
                  </Fragment>
                ))
              )}
              {frame.stimulusVisible && segment.id === 3 && (
                <i className="ap-stimulus" role="img" aria-label="刺激点">
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
              <LocalCurrentFlow
                key={`local-current-${animationEpoch}`}
                step={frame.localCurrentStep}
                drawing={playing}
              />
            </div>
          )}
        </div>

        {mode === "conduction" && !allSegmentsExcited && (
          <div className="ap-region-labels">
            <span>未兴奋区</span>
            <b>兴奋区</b>
            <span>未兴奋区</span>
          </div>
        )}
        {conductionComplete && (
          <p className="ap-bidirectional">
            神经冲动以电信号（局部电流）的形式在神经纤维上双向传导。
          </p>
        )}
      </div>
    </section>
  );
}
