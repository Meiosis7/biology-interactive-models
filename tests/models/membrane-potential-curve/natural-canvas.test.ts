import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const labSource = fs.readFileSync(
  path.join(root, "models/03-membrane-potential-curve/MembraneCurveLab.tsx"),
  "utf8",
);
const styles = fs.readFileSync(
  path.join(root, "models/03-membrane-potential-curve/membrane-curve.css"),
  "utf8",
);

function ruleBody(selector: string) {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = styles.match(new RegExp(`${escaped}\\s*\\{([^}]*)\\}`, "s"));
  expect(match, `missing CSS rule for ${selector}`).not.toBeNull();
  return match![1];
}

describe("膜电位自然单画布结构", () => {
  it("使用一行连续状态替代三块仪表卡", () => {
    expect(labSource).not.toContain("membrane-readouts");
    expect(labSource.match(/membrane-status-line/g)).toHaveLength(1);
  });

  it("把曲线和膜结构放在同一个过程画布中", () => {
    const processCanvas = labSource.match(
      /<section className="membrane-process-canvas">([\s\S]*?)<\/section>/,
    )?.[1];

    expect(processCanvas).toContain("<CurveCanvas");
    expect(processCanvas).toContain("<MembraneView");
  });

  it("使用浅色共享画布而不是多张深色卡片", () => {
    expect(styles).toContain("--mem-bg: #f3f4ef");
    expect(ruleBody(".membrane-shell")).toMatch(/height:\s*100svh\s*;/);
    expect(ruleBody(".membrane-shell")).toMatch(/overflow:\s*hidden\s*;/);
    expect(ruleBody(".membrane-process-canvas")).toMatch(
      /grid-template-columns:\s*minmax\(0,\s*2\.1fr\) minmax\(290px,\s*1fr\)\s*;/,
    );
    expect(ruleBody(".membrane-process-canvas")).toMatch(/background:\s*var\(--mem-paper\)\s*;/);
    expect(ruleBody(".membrane-curve-card")).not.toMatch(/box-shadow|border:\s*1px/);
    expect(ruleBody(".membrane-view-card")).not.toMatch(/box-shadow|border:\s*1px/);
  });

  it("窄屏保持曲线、膜结构与控制台同屏", () => {
    expect(styles).toMatch(
      /@media\s*\(max-width:\s*800px\)[\s\S]*?\.membrane-shell\s*\{[^}]*height:\s*100svh\s*;[^}]*overflow:\s*hidden\s*;/,
    );
  });
});
