import type { ActionPotentialFrame, ActionPotentialMode } from "./types";

const CHANNELS = [
  { species: "sodium", position: 16 },
  { species: "potassium", position: 34 },
  { species: "sodium", position: 50 },
  { species: "potassium", position: 66 },
  { species: "sodium", position: 84 },
] as const;
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
  const outsideSign = "+";
  const insideSign = "−";
  const excitedOutsideSign = frame.polarity === "inside-positive" ? "−" : "+";
  const excitedInsideSign = frame.polarity === "inside-positive" ? "+" : "−";

  return (
    <section
      className={`ap-scene ap-scene--${mode}`}
      data-phase={frame.phase}
      data-playing={playing}
      data-ion-motion={frame.ionMotion}
      data-open-channel={frame.openChannel}
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

      <div className="ap-fiber-stage">
        <div
          className="ap-charge-row ap-charge-row--outside"
          aria-label={`膜外${outsideSign === "+" ? "正" : "负"}`}
        >
          <span>膜外</span>
          {[0, 1, 2, 3, 4, 5, 6].map((item) => (
            <b key={item}>{outsideSign}</b>
          ))}
        </div>

        <div className="ap-fiber" data-testid="shared-fiber">
          <div className="ap-fiber-cap" aria-hidden="true" />
          <div className="ap-fiber-lumen" aria-hidden="true" />
          {CHANNELS.map((channel) => {
            const channelId = `${channel.species}-${channel.position}`;
            const isOpen =
              frame.openChannel === channel.species &&
              (channel.species === "potassium" || channel.position === 50);

            return (
              <i
                key={channelId}
                className={`ap-channel ap-channel--${channel.species === "potassium" ? "k" : "na"}`}
                data-channel-id={channelId}
                data-channel-position={channel.position}
                data-channel-species={channel.species}
                data-open={isOpen}
                style={{ left: `${channel.position}%` }}
              />
            );
          })}
          {frame.stimulusVisible && (
            <i className="ap-stimulus" aria-label="刺激点">
              <span>刺激</span>
            </i>
          )}
          {frame.excitedCenters.map((center, index) => (
            <i
              key={`${mode}-${index}`}
              data-testid="excited-zone"
              className="ap-excited-zone"
              aria-label={`兴奋区外${excitedOutsideSign === "+" ? "正" : "负"}内${excitedInsideSign === "+" ? "正" : "负"}`}
              style={{ left: `${center * 100}%` }}
            >
              <span className="ap-excited-sign ap-excited-sign--outside">
                {excitedOutsideSign}
              </span>
              <span className="ap-excited-sign ap-excited-sign--inside">
                {excitedInsideSign}
              </span>
            </i>
          ))}
          {mode === "resting" && (
            <div
              className="ap-ion-flow ap-ion-flow--k"
              aria-label="K⁺外流"
              data-channel-target="potassium-34"
            >
              <i>K⁺</i>
              <span>↑</span>
              <b>K⁺外流</b>
            </div>
          )}
          {mode === "generation" && frame.phase !== "stimulus" && (
            <div
              className="ap-ion-flow ap-ion-flow--na"
              aria-label="Na⁺内流"
              data-channel-target="sodium-50"
            >
              <i>Na⁺</i>
              <span>↓</span>
              <b>Na⁺内流</b>
            </div>
          )}
        </div>

        <div
          className="ap-charge-row ap-charge-row--inside"
          aria-label={`膜内${insideSign === "+" ? "正" : "负"}`}
        >
          <span>膜内</span>
          {[0, 1, 2, 3, 4, 5, 6].map((item) => (
            <b key={item}>{insideSign}</b>
          ))}
        </div>

        {frame.localCurrentVisible && (
          <div className="ap-local-current" aria-label="局部电流方向">
            <span>←</span>
            <b>局部电流</b>
            <span>→</span>
          </div>
        )}
        {mode === "conduction" && (
          <div className="ap-region-labels">
            <span>未兴奋区</span>
            <b>兴奋区</b>
            <span>未兴奋区</span>
          </div>
        )}
        {mode === "conduction" && <p className="ap-bidirectional">← 双向传导 →</p>}
      </div>
    </section>
  );
}
