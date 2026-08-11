interface IonChannelProps {
  species: "sodium" | "potassium";
  open: boolean;
  label: string;
}

export function IonChannel({ species, open, label }: IonChannelProps) {
  return (
    <i
      className={`ap-ion-channel ap-ion-channel--${species}`}
      data-channel-species={species}
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
