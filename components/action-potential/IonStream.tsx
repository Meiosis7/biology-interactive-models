import type { CSSProperties } from "react";
import type { MembraneSurface } from "./IonChannel";

interface IonStreamProps {
  species: "sodium" | "potassium";
  direction: "inward" | "outward";
  label: string;
  surface: MembraneSurface;
}

const ION_LABELS = { sodium: "Na⁺", potassium: "K⁺" } as const;

export function IonStream({ species, direction, label, surface }: IonStreamProps) {
  const screenDirection =
    (surface === "top" && direction === "inward") ||
    (surface === "bottom" && direction === "outward")
      ? "down"
      : "up";

  return (
    <span
      className={`ap-ion-stream ap-ion-stream--${species} ap-ion-stream--${direction} ap-ion-stream--${surface}`}
      data-ion-species={species}
      data-ion-direction={direction}
      data-membrane-surface={surface}
      data-screen-direction={screenDirection}
      data-stream-axis="channel-pore"
      role="img"
      aria-label={label}
    >
      {[0, 1, 2].map((index) => (
        <i
          key={index}
          className="ap-ion-particle"
          data-ion-particle={species}
          style={{ "--ion-index": index } as CSSProperties}
          aria-hidden="true"
        >
          {ION_LABELS[species]}
        </i>
      ))}
    </span>
  );
}
