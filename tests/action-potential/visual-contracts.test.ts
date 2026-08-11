import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const stylesheet = readFileSync(
  "components/action-potential/action-potential.css",
  "utf8",
);

function ruleBody(selector: string) {
  const escaped = selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const match = stylesheet.match(new RegExp(`${escaped}\\s*\\{([^}]*)\\}`));
  expect(match, `missing CSS rule for ${selector}`).not.toBeNull();
  return match![1];
}

function hexToken(name: string) {
  const match = stylesheet.match(
    new RegExp(`${name}:\\s*(#[0-9a-f]{6})\\s*;`, "i"),
  );
  expect(match, `missing six-digit color token ${name}`).not.toBeNull();
  return match![1];
}

function relativeLuminance(hex: string) {
  const channels = hex
    .slice(1)
    .match(/.{2}/g)!
    .map((channel) => Number.parseInt(channel, 16) / 255)
    .map((channel) =>
      channel <= 0.04045
        ? channel / 12.92
        : ((channel + 0.055) / 1.055) ** 2.4,
    );
  return (
    0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2]
  );
}

function contrastRatio(first: string, second: string) {
  const firstLuminance = relativeLuminance(first);
  const secondLuminance = relativeLuminance(second);
  return (
    (Math.max(firstLuminance, secondLuminance) + 0.05) /
    (Math.min(firstLuminance, secondLuminance) + 0.05)
  );
}

function milliseconds(rule: string, property: string) {
  const match = rule.match(new RegExp(`${property}:\\s*(\\d+)ms\\s*;`));
  expect(match, `missing millisecond property ${property}`).not.toBeNull();
  return Number(match![1]);
}

describe("action-potential ion visual contracts", () => {
  it("uses explicit sodium and potassium fill tokens with 4.5:1 label contrast at desktop and mobile", () => {
    const label = hexToken("--ap-ion-particle-label");
    const sodiumFill = hexToken("--ap-sodium-particle-fill");
    const potassiumFill = hexToken("--ap-potassium-particle-fill");

    expect(contrastRatio(label, sodiumFill)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(label, potassiumFill)).toBeGreaterThanOrEqual(4.5);
    expect(ruleBody(".ap-ion-stream--sodium")).toMatch(
      /--ion-particle-fill:\s*var\(--ap-sodium-particle-fill\)\s*;/,
    );
    expect(ruleBody(".ap-ion-stream--potassium")).toMatch(
      /--ion-particle-fill:\s*var\(--ap-potassium-particle-fill\)\s*;/,
    );
    expect(ruleBody(".ap-ion-particle")).toMatch(
      /background:\s*var\(--ion-particle-fill\)\s*;/,
    );
    expect(ruleBody(".ap-ion-particle")).toMatch(
      /color:\s*var\(--ap-ion-particle-label\)\s*;/,
    );

    const mobileParticleRule = stylesheet.match(
      /@media \(max-width:\s*720px\)[\s\S]*?\.ap-ion-particle\s*\{([^}]*)\}/,
    )?.[1];
    expect(mobileParticleRule).toBeDefined();
    expect(mobileParticleRule).not.toMatch(/(?:background|color)\s*:/);
  });

  it("finishes every sodium particle within a 720ms influx phase and keeps potassium slower", () => {
    const sodiumRule = ruleBody(".ap-ion-stream--sodium");
    const potassiumRule = ruleBody(".ap-ion-stream--potassium");
    const sodiumDuration = milliseconds(sodiumRule, "--ion-duration");
    const sodiumStagger = milliseconds(sodiumRule, "--ion-stagger");
    const potassiumDuration = milliseconds(potassiumRule, "--ion-duration");
    const potassiumStagger = milliseconds(potassiumRule, "--ion-stagger");

    expect(sodiumDuration + 2 * sodiumStagger).toBeLessThanOrEqual(720);
    expect(potassiumDuration).toBeGreaterThan(sodiumDuration);
    expect(potassiumStagger).toBeGreaterThan(sodiumStagger);
    expect(ruleBody(".ap-ion-particle")).toMatch(
      /animation:\s*ap-ion-cross var\(--ion-duration\)[^;]+;/,
    );
    expect(ruleBody(".ap-ion-particle")).toMatch(
      /animation-delay:\s*calc\(var\(--ion-index\) \* var\(--ion-stagger\)\)\s*;/,
    );
    expect(ruleBody(".ap-ion-particle")).toMatch(
      /animation-play-state:\s*paused\s*;/,
    );
    expect(ruleBody('.ap-scene[data-playing="true"] .ap-ion-particle')).toMatch(
      /animation-play-state:\s*running\s*;/,
    );
  });
});
