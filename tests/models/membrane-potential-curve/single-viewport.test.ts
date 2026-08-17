import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const pageSource = readFileSync("app/models/membrane-potential-curve/page.tsx", "utf8");
const labSource = readFileSync(
  "models/03-membrane-potential-curve/MembraneCurveLab.tsx",
  "utf8",
);
const curveSource = readFileSync(
  "models/03-membrane-potential-curve/CurveCanvas.tsx",
  "utf8",
);
const styles = readFileSync(
  "models/03-membrane-potential-curve/membrane-curve.css",
  "utf8",
);

function ruleBody(selector: string) {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = styles.match(new RegExp(`${escaped}\\s*\\{([^}]*)\\}`, "s"));
  expect(match, `missing CSS rule for ${selector}`).not.toBeNull();
  return match![1];
}

describe("membrane potential single-viewport layout", () => {
  it("uses the model itself as the complete route", () => {
    expect(pageSource).not.toContain("ModelNav");
    expect(pageSource).not.toContain("model-shell.css");
  });

  it("marks the lab as one persistent viewport", () => {
    expect(labSource).toContain('data-layout="single-viewport"');
    expect(ruleBody(".membrane-shell")).toMatch(/height:\s*100svh\s*;/);
    expect(ruleBody(".membrane-shell")).toMatch(/overflow:\s*hidden\s*;/);
    expect(ruleBody(".membrane-shell")).toMatch(
      /grid-template-rows:\s*auto minmax\(0,\s*1fr\) auto auto\s*;/,
    );
  });

  it("keeps the stage explanation inside medium-width viewports", () => {
    expect(styles).toMatch(
      /@media\s*\(max-width:\s*1100px\)\s*and\s*\(min-width:\s*801px\)[\s\S]*?\.membrane-stage-guide\s*\{[^}]*grid-template-columns:\s*minmax\(440px,\s*1\.25fr\) minmax\(300px,\s*1fr\)\s*;/,
    );
  });

  it("lets both synchronized views shrink inside the same middle row", () => {
    expect(ruleBody(".membrane-process-canvas")).toMatch(/min-height:\s*0\s*;/);
    expect(ruleBody(".membrane-curve-card")).toMatch(/height:\s*100%\s*;/);
    expect(ruleBody(".membrane-view-card")).toMatch(/height:\s*100%\s*;/);
    expect(ruleBody(".membrane-curve-card canvas")).toMatch(/height:\s*100%\s*;/);
    expect(ruleBody(".membrane-scene")).toMatch(/min-height:\s*0\s*;/);
  });

  it("keeps comparison feedback inside the curve card", () => {
    expect(labSource).not.toContain('className="membrane-compare-result"');
    expect(curveSource).toContain('aria-label="对比结论"');
  });

  it("restores a scrollable vertical layout on narrow screens", () => {
    expect(styles).toMatch(
      /@media\s*\(max-width:\s*800px\)[\s\S]*?\.membrane-shell\s*\{[^}]*height:\s*auto\s*;[^}]*overflow:\s*visible\s*;/,
    );
  });
});
