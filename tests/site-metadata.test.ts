import { readFileSync, statSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("site metadata and presentation assets", () => {
  it("keeps the action-potential metadata wired to the social card", () => {
    const layout = readFileSync("app/layout.tsx", "utf8");
    const socialCard = statSync("public/og.png");

    expect(layout).toContain("动作电位的形成和传导｜高中生物交互模型");
    expect(layout).toContain("/og.png");
    expect(layout).toContain('card: "summary_large_image"');
    expect(socialCard.isFile()).toBe(true);
    expect(socialCard.size).toBeGreaterThan(0);
  });

  it("gives the chart canvas an explicit responsive CSS height", () => {
    const css = readFileSync(
      "components/action-potential/action-potential.css",
      "utf8",
    );
    const canvasRule = css.match(/\.chart-card canvas\s*\{([^}]*)\}/)?.[1] ?? "";

    expect(canvasRule).toMatch(/height:\s*clamp\(/);
    expect(canvasRule).not.toMatch(/min-height:/);
  });
});
