interface LocalCurrentFlowProps {
  layer: "inside" | "outside";
}

export function LocalCurrentFlow({ layer }: LocalCurrentFlowProps) {
  const outward = layer === "inside";
  const label = outward
    ? "膜内局部电流向两侧未兴奋区"
    : "膜外局部电流返回兴奋区";

  return (
    <div
      className={`ap-current-flow ap-current-flow--${layer}`}
      data-current-direction={outward ? "outward" : "inward"}
      aria-label={label}
    >
      <svg viewBox="0 0 400 42" preserveAspectRatio="none" aria-hidden="true">
        <path
          className="ap-current-track ap-current-track--left"
          d="M200 22 C150 22 100 22 28 22"
        />
        <path
          className="ap-current-track ap-current-track--right"
          d="M200 22 C250 22 300 22 372 22"
        />
        <circle
          className="ap-current-dot ap-current-dot--left"
          cx="200"
          cy="22"
          r="4"
          data-current-branch="left"
        />
        <circle
          className="ap-current-dot ap-current-dot--right"
          cx="200"
          cy="22"
          r="4"
          data-current-branch="right"
        />
      </svg>
      <b>{outward ? "膜内局部电流" : "膜外回流"}</b>
    </div>
  );
}
