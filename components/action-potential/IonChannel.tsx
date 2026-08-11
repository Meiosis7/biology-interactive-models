export type MembraneSurface = "top" | "bottom";

interface IonChannelProps {
  species: "sodium" | "potassium";
  open: boolean;
  label: string;
  surface: MembraneSurface;
}

export function IonChannel({ species, open, label, surface }: IonChannelProps) {
  return (
    <i
      className={`ap-ion-channel ap-ion-channel--${species} ap-ion-channel--${surface}`}
      data-channel-species={species}
      data-membrane-surface={surface}
      data-open={open}
      role="img"
      aria-label={label}
    >
      <span
        className="ap-ion-channel__petal ap-ion-channel__petal--left"
        data-channel-petal="left"
        aria-hidden="true"
      />
      <span
        className="ap-ion-channel__pore"
        data-channel-pore
        aria-hidden="true"
      />
      <span
        className="ap-ion-channel__petal ap-ion-channel__petal--right"
        data-channel-petal="right"
        aria-hidden="true"
      />
    </i>
  );
}
