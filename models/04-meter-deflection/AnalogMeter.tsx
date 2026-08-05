"use client";

export interface AnalogMeterProps {
  differenceMv: number;
  pointerAngle: number;
  leadsReversed: boolean;
}

function signed(value: number) {
  return `${value > 0 ? "+" : ""}${value.toFixed(0)}`;
}

export function AnalogMeter({ differenceMv, pointerAngle, leadsReversed }: AnalogMeterProps) {
  const angle = -90 + pointerAngle;
  const needleX = 100 + 58 * Math.cos((angle * Math.PI) / 180);
  const needleY = 110 + 58 * Math.sin((angle * Math.PI) / 180);

  return (
    <section className="meter-analog-card" aria-label="检流计">
      <header><span>检流计</span><strong data-testid="meter-difference">U = {signed(differenceMv)} mV</strong></header>
      <svg viewBox="0 0 200 148" role="img" aria-label={`检流计读数 ${signed(differenceMv)} 毫伏，指针偏转 ${pointerAngle.toFixed(0)} 度。`}>
        <path className="meter-arc" d="M 32 110 A 68 68 0 0 1 168 110" />
        {[-42, -21, 0, 21, 42].map((mark) => {
          const markAngle = (-90 + mark) * Math.PI / 180;
          const outerX = 100 + 68 * Math.cos(markAngle);
          const outerY = 110 + 68 * Math.sin(markAngle);
          const innerX = 100 + 57 * Math.cos(markAngle);
          const innerY = 110 + 57 * Math.sin(markAngle);
          return <g key={mark}><line x1={outerX} y1={outerY} x2={innerX} y2={innerY} /><text x={100 + 82 * Math.cos(markAngle)} y={110 + 82 * Math.sin(markAngle) + 4}>{mark === 0 ? "0" : mark > 0 ? "+" : "−"}</text></g>;
        })}
        <line className="meter-needle" x1="100" y1="110" x2={needleX} y2={needleY} />
        <circle className="meter-hub" cx="100" cy="110" r="6" />
        <text className="meter-unit" x="100" y="139">mV</text>
      </svg>
      <p>{leadsReversed ? "导线已交换：表头按 V_B − V_A 显示。" : "当前接法：表头按 V_A − V_B 显示。"}</p>
    </section>
  );
}
