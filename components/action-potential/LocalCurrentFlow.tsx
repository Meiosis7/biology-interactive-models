const ROUND_PAIRS = {
  1: [
    { side: "left", source: 3, target: 2 },
    { side: "right", source: 3, target: 4 },
  ],
  2: [
    { side: "left", source: 2, target: 1 },
    { side: "right", source: 4, target: 5 },
  ],
  3: [
    { side: "left", source: 1, target: 0 },
    { side: "right", source: 5, target: 6 },
  ],
} as const;

interface LocalCurrentFlowProps {
  step: 1 | 2 | 3;
}

const centerX = (segment: number) => 50 + segment * 100;

export function LocalCurrentFlow({ step }: LocalCurrentFlowProps) {
  const pairs = ROUND_PAIRS[step];

  return (
    <svg
      className="ap-current-arcs"
      viewBox="0 0 700 160"
      preserveAspectRatio="none"
      aria-label="局部电流方向"
      data-current-step={step}
    >
      <defs>
        <marker
          id="ap-current-arrow-inside"
          viewBox="0 0 10 10"
          refX="9"
          refY="5"
          markerWidth="5"
          markerHeight="5"
          orient="auto"
        >
          <path className="ap-current-arrow--inside" d="M 0 0 L 10 5 L 0 10 z" />
        </marker>
        <marker
          id="ap-current-arrow-outside"
          viewBox="0 0 10 10"
          refX="9"
          refY="5"
          markerWidth="5"
          markerHeight="5"
          orient="auto"
        >
          <path className="ap-current-arrow--outside" d="M 0 0 L 10 5 L 0 10 z" />
        </marker>
      </defs>
      {pairs.flatMap(({ side, source, target }) => {
        const sourceX = centerX(source);
        const targetX = centerX(target);
        const midpoint = (sourceX + targetX) / 2;
        return [
          <path
            key={`inside-${side}`}
            className="ap-current-arc ap-current-arc--inside"
            d={`M ${sourceX} 93 Q ${midpoint} 111 ${targetX} 93`}
            markerEnd="url(#ap-current-arrow-inside)"
            data-current-arc={`${step}-inside-${side}`}
            data-current-layer="inside"
            data-current-direction="outward"
            data-current-side={side}
            data-source-segment={source}
            data-target-segment={target}
          />,
          <path
            key={`outside-${side}`}
            className="ap-current-arc ap-current-arc--outside"
            d={`M ${targetX} 22 Q ${midpoint} 4 ${sourceX} 22`}
            markerEnd="url(#ap-current-arrow-outside)"
            data-current-arc={`${step}-outside-${side}`}
            data-current-layer="outside"
            data-current-direction="inward"
            data-current-side={side}
            data-source-segment={target}
            data-target-segment={source}
          />,
        ];
      })}
    </svg>
  );
}
