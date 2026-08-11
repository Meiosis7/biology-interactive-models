import { readFileSync, statSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("site metadata and presentation assets", () => {
  it("keeps the biology model suite metadata wired to the social card", () => {
    const layout = readFileSync("app/layout.tsx", "utf8");
    const socialCard = statSync("public/og.png");

    expect(layout).toContain("高中生物动态交互模型");
    expect(layout).toContain("动作电位");
    expect(layout).toContain("突触传递");
    expect(layout).toContain("免疫调节");
    expect(layout).toContain("/og.png");
    expect(layout).toContain('card: "summary_large_image"');
    expect(socialCard.isFile()).toBe(true);
    expect(socialCard.size).toBeGreaterThan(0);
  });

  it("uses a 1200 by 630 social card", () => {
    const socialCard = readFileSync("public/og.png");

    expect(socialCard.readUInt32BE(16)).toBe(1200);
    expect(socialCard.readUInt32BE(20)).toBe(630);
  });

  it("uses one responsive textbook-style shared-fiber diagram", () => {
    const css = readFileSync(
      "components/action-potential/action-potential.css",
      "utf8",
    );

    expect(css).toMatch(/--ap-paper:\s*#fffdf8/);
    expect(css).toMatch(/\.ap-fiber\s*\{[^}]*border-radius:\s*999px/s);
    expect(css).toMatch(
      /\.ap-fiber\s*\{[^}]*grid-template-columns:\s*repeat\(7,\s*minmax\(0,\s*1fr\)\)/s,
    );
    expect(css).toMatch(/\.ap-workspace\s*\{[^}]*grid-template-columns:/s);
    expect(css).toMatch(
      /@media\s*\(max-width:\s*720px\)[\s\S]*\.ap-workspace\s*\{[^}]*grid-template-columns:\s*1fr/s,
    );
    expect(css).toMatch(
      /@media\s*\(prefers-reduced-motion:\s*reduce\)[\s\S]*transition:\s*none\s*!important[\s\S]*animation:\s*none\s*!important/s,
    );
    expect(css).not.toMatch(/\.chart-card|canvas/);
  });
});
