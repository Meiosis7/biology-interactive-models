import type { CSSProperties } from "react";

interface IonStreamProps {
  species: "sodium" | "potassium";
  direction: "inward" | "outward";
  label: string;
}

const ION_LABELS = {
  sodium: "Na⁺",
  potassium: "K⁺",
} as const;

export function IonStream({ species, direction, label }: IonStreamProps) {
  return (
    <span
      className={`ap-ion-stream ap-ion-stream--${species} ap-ion-stream--${direction}`}
      data-ion-species={species}
      data-ion-direction={direction}
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
