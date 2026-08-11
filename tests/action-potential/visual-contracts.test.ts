import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { MODE_DURATION_MS } from "../../components/action-potential/modeData";
import { getActionPotentialFrame } from "../../components/action-potential/simulation";

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

function zIndex(selector: string) {
  const match = ruleBody(selector).match(/z-index:\s*(\d+)\s*;/);
  expect(match, `missing numeric z-index for ${selector}`).not.toBeNull();
  return Number(match![1]);
}

function conductionPhaseWindows() {
  const windows: Array<{ phase: string; durationMs: number }> = [];

  for (let elapsedMs = 0; elapsedMs < MODE_DURATION_MS; elapsedMs += 1) {
    const phase = getActionPotentialFrame(
      "conduction",
      elapsedMs / MODE_DURATION_MS,
    ).phase;
    const current = windows.at(-1);
    if (current?.phase === phase) {
      current.durationMs += 1;
    } else {
      windows.push({ phase, durationMs: 1 });
    }
  }

  return windows;
}

function generationPhaseWindows() {
  const windows: Array<{
    phase: string;
    startMs: number;
    durationMs: number;
  }> = [];

  for (let elapsedMs = 0; elapsedMs < MODE_DURATION_MS; elapsedMs += 1) {
    const phase = getActionPotentialFrame(
      "generation",
      elapsedMs / MODE_DURATION_MS,
    ).phase;
    const current = windows.at(-1);
    if (current?.phase === phase) {
      current.durationMs += 1;
    } else {
      windows.push({ phase, startMs: elapsedMs, durationMs: 1 });
    }
  }

  return windows;
}

describe("action-potential ion visual contracts", () => {
  it("draws the shared fiber with open flat ends", () => {
    const fiberRule = ruleBody(".ap-fiber");
    const firstSegmentRule = ruleBody(".ap-membrane-segment:first-child");
    const lastSegmentRule = ruleBody(".ap-membrane-segment:last-child");

    expect(fiberRule).toMatch(/border-top:\s*3px solid #6e7478\s*;/);
    expect(fiberRule).toMatch(/border-bottom:\s*3px solid #6e7478\s*;/);
    expect(fiberRule).toMatch(/border-left:\s*0\s*;/);
    expect(fiberRule).toMatch(/border-right:\s*0\s*;/);
    expect(fiberRule).toMatch(/border-radius:\s*0\s*;/);
    expect(fiberRule).not.toMatch(/border:\s*3px solid/);
    expect(firstSegmentRule).toMatch(/border-radius:\s*0\s*;/);
    expect(lastSegmentRule).toMatch(/border-radius:\s*0\s*;/);
  });

  it("keeps four charge rows fixed around the two membrane lines", () => {
    expect(ruleBody(".ap-segment-charge--outside-top")).toMatch(
      /top:\s*-29px\s*;/,
    );
    expect(ruleBody(".ap-segment-charge--inside-top")).toMatch(
      /top:\s*10px\s*;/,
    );
    expect(ruleBody(".ap-segment-charge--inside-bottom")).toMatch(
      /bottom:\s*10px\s*;/,
    );
    expect(ruleBody(".ap-segment-charge--outside-bottom")).toMatch(
      /bottom:\s*-29px\s*;/,
    );
  });

  it("draws short current arcs without step-dependent full-width lanes", () => {
    expect(ruleBody(".ap-local-current-system")).toMatch(
      /inset:\s*-38px 0 -22px\s*;/,
    );
    expect(ruleBody(".ap-current-arc")).toMatch(
      /stroke-dasharray:\s*6 6\s*;/,
    );
    expect(stylesheet).not.toMatch(
      /\.ap-local-current-system\[data-current-step=/,
    );
  });

  it("keeps current arcs above membrane fills but behind charges, channels, and ions", () => {
    const currentLayer = zIndex(".ap-local-current-system");

    expect(currentLayer).toBeGreaterThan(0);
    expect(currentLayer).toBeLessThan(zIndex(".ap-segment-charge"));
    expect(currentLayer).toBeLessThan(zIndex(".ap-ion-channel"));
    expect(currentLayer).toBeLessThan(zIndex(".ap-ion-stream"));
  });

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

  it("finishes every sodium particle with margin inside each schedule-derived influx phase", () => {
    const sodiumRule = ruleBody(".ap-ion-stream--sodium");
    const potassiumRule = ruleBody(".ap-ion-stream--potassium");
    const sodiumDuration = milliseconds(sodiumRule, "--ion-duration");
    const sodiumStagger = milliseconds(sodiumRule, "--ion-stagger");
    const potassiumDuration = milliseconds(potassiumRule, "--ion-duration");
    const potassiumStagger = milliseconds(potassiumRule, "--ion-stagger");
    const windows = conductionPhaseWindows();
    const influxDurations = windows
      .filter(({ phase }) => phase === "neighbor-sodium-in")
      .map(({ durationMs }) => durationMs);
    const lastSodiumCompletion = sodiumDuration + 2 * sodiumStagger;

    expect(MODE_DURATION_MS).toBeGreaterThanOrEqual(5500);
    expect(MODE_DURATION_MS).toBeLessThanOrEqual(6500);
    expect(windows.map(({ phase }) => phase)).toEqual([
      "local-current",
      "neighbor-sodium-in",
      "neighbor-excited",
      "local-current",
      "neighbor-sodium-in",
      "neighbor-excited",
      "local-current",
      "neighbor-sodium-in",
      "neighbor-excited",
      "conducted",
    ]);
    const currentDurations = windows
      .filter(({ phase }) => phase === "local-current")
      .map(({ durationMs }) => durationMs);
    const newlyExcitedDurations = windows
      .filter(({ phase }) => phase === "neighbor-excited")
      .map(({ durationMs }) => durationMs);

    expect(currentDurations).toEqual([520, 520, 520]);
    expect(newlyExcitedDurations).toEqual([360, 360, 360]);
    expect(windows.at(-1)).toEqual({ phase: "conducted", durationMs: 600 });
    expect(influxDurations).toHaveLength(3);
    for (const influxDuration of influxDurations) {
      expect(influxDuration).toBeGreaterThanOrEqual(850);
      expect(influxDuration).toBeLessThanOrEqual(1000);
      expect(influxDuration - lastSodiumCompletion).toBeGreaterThanOrEqual(50);
    }
    expect(sodiumDuration).toBeGreaterThanOrEqual(650);
    expect(sodiumDuration).toBeLessThanOrEqual(850);
    expect(sodiumStagger).toBeGreaterThanOrEqual(100);
    expect(sodiumStagger).toBeLessThanOrEqual(130);
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

  it("plays sodium once with both fill while potassium outflow remains infinite", () => {
    const sodiumRule = ruleBody(".ap-ion-stream--sodium");
    const potassiumRule = ruleBody(".ap-ion-stream--potassium");
    const particleRule = ruleBody(".ap-ion-particle");

    expect(sodiumRule).toMatch(/--ion-iteration-count:\s*1\s*;/);
    expect(sodiumRule).toMatch(/--ion-fill-mode:\s*both\s*;/);
    expect(potassiumRule).toMatch(
      /--ion-iteration-count:\s*infinite\s*;/,
    );
    expect(particleRule).toMatch(
      /animation:[^;]*var\(--ion-iteration-count\)[^;]*var\(--ion-fill-mode\)[^;]*;/,
    );
    expect(stylesheet).toMatch(
      /@keyframes ap-ion-cross\s*\{[\s\S]*?0%\s*\{[^}]*var\(--ion-start-y\)[^}]*opacity:\s*0\s*;[^}]*\}[\s\S]*?100%\s*\{[^}]*var\(--ion-end-y\)[^}]*opacity:\s*0\s*;[^}]*\}/,
    );
  });

  it("excites the center 150–250ms after the generation sodium particles finish", () => {
    const sodiumRule = ruleBody(".ap-ion-stream--sodium");
    const lastParticleCompletion =
      milliseconds(sodiumRule, "--ion-duration") +
      2 * milliseconds(sodiumRule, "--ion-stagger");
    const windows = generationPhaseWindows();
    const sodiumWindow = windows.find(({ phase }) => phase === "sodium-in")!;
    const causalTail = sodiumWindow.durationMs - lastParticleCompletion;

    expect(windows.map(({ phase }) => phase)).toEqual([
      "stimulus",
      "sodium-channel-opening",
      "sodium-in",
      "excited",
    ]);
    expect(windows.reduce((total, window) => total + window.durationMs, 0)).toBe(
      MODE_DURATION_MS,
    );
    expect(windows[0].durationMs).toBeGreaterThanOrEqual(900);
    expect(windows[1].durationMs).toBeGreaterThanOrEqual(1000);
    expect(windows[3].durationMs).toBeGreaterThanOrEqual(1500);
    expect(causalTail).toBeGreaterThanOrEqual(150);
    expect(causalTail).toBeLessThanOrEqual(250);
    expect(windows[3].startMs).toBe(
      sodiumWindow.startMs + sodiumWindow.durationMs,
    );
  });
});
