import { render, screen } from "@testing-library/react";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { MembraneCurveLab } from "../../../models/03-membrane-potential-curve/MembraneCurveLab";

const styles = readFileSync(
  "models/03-membrane-potential-curve/membrane-curve.css",
  "utf8",
);

describe("膜电位模型 AI 素材融合", () => {
  it("为 Na⁺ 和 K⁺ 通道提供不同的 AI 蛋白视觉层", () => {
    render(<MembraneCurveLab />);

    const sodiumArt = screen.getByLabelText("Na⁺ 通道").querySelector(".membrane-channel-art");
    const potassiumArt = screen.getByLabelText("K⁺ 通道").querySelector(".membrane-channel-art");

    expect(sodiumArt).toHaveAttribute("data-protein", "sodium");
    expect(potassiumArt).toHaveAttribute("data-protein", "potassium");
  });

  it("通道蛋白引用受体素材层", () => {
    expect(styles).toMatch(
      /\.membrane-channel-art\s*\{[^}]*background-image:\s*url\("\/synapse-cinematic\/receptors-layer\.png"\)/s,
    );
    expect(styles).toMatch(/\[data-protein="sodium"\]/);
    expect(styles).toMatch(/\[data-protein="potassium"\]/);
  });

  it("静态粒子和流动粒子引用小球素材层", () => {
    expect(styles).toMatch(
      /\.membrane-particle::before\s*\{[^}]*background-image:\s*url\("\/synapse-cinematic\/transmitters-layer\.png"\)/s,
    );
    expect(styles).toMatch(
      /\.membrane-flow-dot\s*\{[^}]*background-image:\s*url\("\/synapse-cinematic\/transmitters-layer\.png"\)/s,
    );
  });
});
