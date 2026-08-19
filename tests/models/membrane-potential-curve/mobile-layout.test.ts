import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const styles = readFileSync(
  "models/03-membrane-potential-curve/membrane-curve.css",
  "utf8",
);

const mobileStart = styles.indexOf("@media (max-width: 800px)");
const reducedMotionStart = styles.indexOf(
  "@media (prefers-reduced-motion: reduce)",
  mobileStart,
);
const mobileStyles = styles.slice(mobileStart, reducedMotionStart);

function mobileRuleBody(selector: string) {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = mobileStyles.match(new RegExp(`${escaped}\\s*\\{([^}]*)\\}`, "s"));
  expect(match, `missing mobile CSS rule for ${selector}`).not.toBeNull();
  return match![1];
}

describe("membrane potential mobile layout", () => {
  it("bounds the complete mobile model to one viewport", () => {
    expect(mobileRuleBody(".membrane-shell")).toMatch(/display:\s*grid\s*;/);
    expect(mobileRuleBody(".membrane-shell")).toMatch(/height:\s*100svh\s*;/);
    expect(mobileRuleBody(".membrane-shell")).toMatch(/overflow:\s*hidden\s*;/);
    expect(mobileRuleBody(".membrane-shell")).toMatch(
      /grid-template-rows:\s*auto minmax\(0,\s*1fr\) auto auto\s*;/,
    );
  });

  it("keeps the curve and ion-channel cause view in the flexible middle area", () => {
    expect(mobileRuleBody(".membrane-process-canvas")).toMatch(
      /grid-template-rows:\s*minmax\(0,\s*\.9fr\) minmax\(0,\s*1\.1fr\)\s*;/,
    );
    expect(mobileRuleBody(".membrane-process-canvas")).toMatch(/min-height:\s*0\s*;/);
    expect(mobileRuleBody(".membrane-curve-card")).toMatch(/height:\s*100%\s*;/);
    expect(mobileRuleBody(".membrane-view-card")).toMatch(/height:\s*100%\s*;/);
    expect(mobileRuleBody(".membrane-curve-card canvas")).toMatch(/height:\s*100%\s*;/);
    expect(mobileRuleBody(".membrane-scene")).toMatch(/height:\s*100%\s*;/);
  });

  it("keeps stage voltage and ion flow on one compact status row", () => {
    expect(mobileRuleBody(".membrane-status-line")).toMatch(
      /grid-template-columns:\s*repeat\(3,\s*minmax\(0,\s*1fr\)\)\s*;/,
    );
    expect(mobileRuleBody(".membrane-status-line span:last-child")).toMatch(
      /grid-column:\s*auto\s*;/,
    );
  });

  it("compresses the stage guide to navigation plus current ion information", () => {
    expect(mobileRuleBody(".membrane-stage-guide")).toMatch(
      /grid-template-rows:\s*auto auto\s*;/,
    );
    expect(mobileRuleBody(".membrane-stage-nav")).toMatch(
      /grid-template-columns:\s*repeat\(7,\s*minmax\(0,\s*1fr\)\)\s*;/,
    );
    expect(mobileRuleBody(".membrane-stage-detail > div p")).toMatch(
      /display:\s*none\s*;/,
    );
    expect(mobileRuleBody(".membrane-stage-detail > div p:nth-child(2)")).toMatch(
      /display:\s*grid\s*;/,
    );
  });

  it("keeps essential controls in two compact rows", () => {
    expect(mobileRuleBody(".membrane-controls")).toMatch(
      /grid-template-columns:\s*minmax\(0,\s*1fr\) auto\s*;/,
    );
    expect(mobileRuleBody(".membrane-timeline")).toMatch(
      /grid-column:\s*1\s*\/\s*-1\s*;/,
    );
    expect(mobileRuleBody(".membrane-options")).toMatch(/display:\s*none\s*;/);
  });
});
