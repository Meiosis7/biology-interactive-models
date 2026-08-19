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
  it("lets the visual cards grow with their content", () => {
    expect(mobileRuleBody(".membrane-curve-card")).toMatch(/height:\s*auto\s*;/);
    expect(mobileRuleBody(".membrane-view-card")).toMatch(/height:\s*auto\s*;/);
    expect(mobileRuleBody(".membrane-scene")).toMatch(/min-height:\s*0\s*;/);
    expect(mobileRuleBody(".membrane-scene")).toMatch(/height:\s*clamp\(/);
  });

  it("moves the ion-flow status onto its own full-width row", () => {
    expect(mobileRuleBody(".membrane-status-line")).toMatch(
      /grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\)\s*;/,
    );
    expect(mobileRuleBody(".membrane-status-line span:last-child")).toMatch(
      /grid-column:\s*1\s*\/\s*-1\s*;/,
    );
  });

  it("allows dense labels and controls to wrap instead of overlapping", () => {
    expect(mobileRuleBody(".membrane-curve-card figcaption")).toMatch(
      /flex-wrap:\s*wrap\s*;/,
    );
    expect(mobileRuleBody(".membrane-view-card > header")).toMatch(
      /flex-wrap:\s*wrap\s*;/,
    );
    expect(mobileRuleBody(".membrane-options")).toMatch(/flex-wrap:\s*wrap\s*;/);
  });
});
