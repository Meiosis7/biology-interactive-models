import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const viewSource = readFileSync(
  "models/03-membrane-potential-curve/MembraneView.tsx",
  "utf8",
);
const styles = readFileSync(
  "models/03-membrane-potential-curve/membrane-curve.css",
  "utf8",
);

describe("膜电位模型持续离子运动", () => {
  it("让膜两侧粒子持续做不同步的微运动", () => {
    expect(styles).toMatch(
      /\.membrane-particle\s*\{[^}]*animation:[^;}]*ion-drift-a[^;}]*infinite/s,
    );
    expect(styles).toMatch(/@keyframes\s+ion-drift-a/);
    expect(styles).toMatch(/@keyframes\s+ion-drift-b/);
    expect(styles).toMatch(/@keyframes\s+ion-drift-c/);
    expect(viewSource).toContain("animationDelay");
    expect(viewSource).toContain("animationDuration");
    expect(viewSource).toMatch(/top:\s*`\$\{/);
    expect(styles).toMatch(/calc\(-50% [+-] 16px\)/);
    expect(styles).toMatch(
      /\.membrane-particle::before\s*\{[^}]*animation:[^;}]*ion-pulse[^;}]*infinite/s,
    );
    expect(styles).toMatch(/@keyframes\s+ion-pulse/);
  });

  it("让开放通道的定向离子流独立于时间轴播放状态", () => {
    expect(styles).toMatch(
      /\.membrane-flow-track\.sodium \.membrane-flow-dot\s*\{[^}]*animation:[^;}]*sodium-track-in[^;}]*infinite/s,
    );
    expect(styles).toMatch(
      /\.membrane-flow-track\.potassium \.membrane-flow-dot\s*\{[^}]*animation:[^;}]*potassium-track-out[^;}]*infinite/s,
    );
    expect(styles).not.toMatch(
      /\.membrane-scene\.is-playing \.membrane-flow-track/,
    );
  });

  it("保留减少动态效果的无障碍降级", () => {
    expect(styles).toMatch(/@media\s*\(prefers-reduced-motion:\s*reduce\)/);
    expect(styles).toMatch(/animation-duration:\s*\.001ms\s*!important/);
  });
});
