import type { ActionPotentialFrame, ActionPotentialMode } from "./types";

const ION_POSITIONS = [12, 28, 44, 60, 76, 90];

const MODE_LABELS: Record<ActionPotentialMode, string> = {
  resting: "静息电位",
  generation: "动作电位产生",
  conduction: "动作电位传导",
};

const MODE_CAPTIONS: Record<ActionPotentialMode, string> = {
  resting: "K⁺外流，形成外正内负",
  generation: "Na⁺先内流，随后K⁺外流",
  conduction: "刺激点两侧的相邻部位依次兴奋",
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
  const outsideSign =
    mode === "conduction" || frame.polarity === "outside-positive" ? "+" : "−";
  const insideSign =
    mode === "conduction" || frame.polarity === "outside-positive" ? "−" : "+";

  return (
    <section
      className={`ap-scene ap-scene--${mode}`}
      data-phase={frame.phase}
      data-ion-motion={frame.ionMotion}
      data-playing={playing}
      data-polarity={frame.polarity}
      aria-label={`${MODE_LABELS[mode]}动态示意`}
    >
      <div className="ap-polarity ap-polarity--outside">
        <span>膜外</span>
        <b>{outsideSign}</b>
        <b>{outsideSign}</b>
        <b>{outsideSign}</b>
      </div>

      <div className="ap-membrane">
        {ION_POSITIONS.map((left, index) => (
          <i
            key={`channel-${left}`}
            className={`ap-channel ${index % 2 ? "ap-channel--k" : "ap-channel--na"}`}
            style={{ left: `${left}%` }}
          />
        ))}
        {mode === "conduction" && (
          <i className="ap-stimulus-point" aria-label="刺激点" />
        )}
        {mode === "conduction" &&
          frame.excitedCenters.map((center, index) => (
            <i
              key={index}
              data-testid="excited-zone"
              aria-label="兴奋区外负内正"
              className="ap-excited-zone"
              style={{ left: `${center * 100}%` }}
            >
              <span>−</span>
              <span>+</span>
            </i>
          ))}
      </div>

      <div className="ap-polarity ap-polarity--inside">
        <span>膜内</span>
        <b>{insideSign}</b>
        <b>{insideSign}</b>
        <b>{insideSign}</b>
      </div>

      <div className="ap-ion-layer" aria-hidden="true">
        {ION_POSITIONS.slice(0, 4).map((left) => (
          <i
            key={`na-${left}`}
            className="ap-ion ap-ion--na"
            style={{ left: `${left}%` }}
          >
            Na⁺
          </i>
        ))}
        {ION_POSITIONS.slice(2).map((left) => (
          <i
            key={`k-${left}`}
            className="ap-ion ap-ion--k"
            style={{ left: `${left}%` }}
          >
            K⁺
          </i>
        ))}
      </div>

      {frame.localCurrentVisible && (
        <div className="ap-local-current" aria-label="局部电流方向">
          <span>←</span>
          <b>局部电流</b>
          <span>→</span>
        </div>
      )}

      <p className="ap-scene-caption">{MODE_CAPTIONS[mode]}</p>
    </section>
  );
}
