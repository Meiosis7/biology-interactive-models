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
    expect(firstSegmentRule).toMatch(/border-left:\s*0\s*;/);
    expect(firstSegmentRule).toMatch(/border-radius:\s*0\s*;/);
    expect(lastSegmentRule).toMatch(/border-radius:\s*0\s*;/);
  });

  it("uses only top-and-bottom emphasis for excited and target states", () => {
    const excitedRule = ruleBody(
      '.ap-membrane-segment[data-segment-polarity="excited"]',
    );
    const targetRule = ruleBody(
      '.ap-membrane-segment[data-current-target="true"]',
    );
    const targetKeyframes = stylesheet.match(
      /@keyframes ap-target-glow\s*\{([\s\S]*?)\n\}/,
    )?.[1];

    expect(targetKeyframes).toBeDefined();
    for (const emphasis of [excitedRule, targetRule, targetKeyframes!]) {
      expect(emphasis).toMatch(/inset\s+0\s+2px\s+0/);
      expect(emphasis).toMatch(/inset\s+0\s+-2px\s+0/);
      expect(emphasis).not.toMatch(/inset\s+0\s+0\s+0/);
      expect(emphasis).not.toMatch(/(?:^|,)\s*0\s+0\s+0\s+\d+px/m);
    }
  });

  it("uses 300ms keyframes whose play state follows the scene", () => {
    const segmentRule = ruleBody(".ap-membrane-segment");
    const excitedRule = ruleBody(
      '.ap-membrane-segment[data-segment-polarity="excited"]',
    );
    const leftOpenRule = ruleBody(
      '.ap-ion-channel[data-open="true"] .ap-ion-channel__petal--left',
    );
    const rightOpenRule = ruleBody(
      '.ap-ion-channel[data-open="true"] .ap-ion-channel__petal--right',
    );
    const poreOpenRule = ruleBody(
      '.ap-ion-channel[data-open="true"] .ap-ion-channel__pore',
    );

    expect(segmentRule).not.toMatch(/transition:/);
    expect(ruleBody(".ap-ion-channel__petal")).not.toMatch(/transition:/);
    expect(ruleBody(".ap-ion-channel__pore")).not.toMatch(/transition:/);
    expect(excitedRule).toMatch(
      /animation:\s*ap-segment-excite 300ms ease both/,
    );
    expect(leftOpenRule).toMatch(
      /animation:\s*ap-channel-open-left 300ms cubic-bezier\([^)]*\) both/,
    );
    expect(rightOpenRule).toMatch(
      /animation:\s*ap-channel-open-right 300ms cubic-bezier\([^)]*\) both/,
    );
    expect(poreOpenRule).toMatch(
      /animation:\s*ap-channel-pore-open 300ms ease both/,
    );
    for (const animatedRule of [
      excitedRule,
      leftOpenRule,
      rightOpenRule,
      poreOpenRule,
    ]) {
      expect(animatedRule).toMatch(/animation-play-state:\s*paused/);
    }
    expect(
      ruleBody(
        '.ap-scene[data-playing="true"] .ap-membrane-segment[data-segment-polarity="excited"]',
      ),
    ).toMatch(/animation-play-state:\s*running/);
    expect(
      ruleBody(
        '.ap-scene[data-playing="true"] .ap-ion-channel[data-open="true"] .ap-ion-channel__petal',
      ),
    ).toMatch(/animation-play-state:\s*running/);
    expect(
      ruleBody(
        '.ap-scene[data-playing="true"] .ap-ion-channel[data-open="true"] .ap-ion-channel__pore',
      ),
    ).toMatch(/animation-play-state:\s*running/);
  });

  it("opens channel petals with horizontal translation and no rotation", () => {
    const leftOpenRule = ruleBody(
      '.ap-ion-channel[data-open="true"] .ap-ion-channel__petal--left',
    );
    const rightOpenRule = ruleBody(
      '.ap-ion-channel[data-open="true"] .ap-ion-channel__petal--right',
    );
    const leftKeyframes = stylesheet.match(
      /@keyframes ap-channel-open-left\s*\{([\s\S]*?)\n\}/,
    )?.[1];
    const rightKeyframes = stylesheet.match(
      /@keyframes ap-channel-open-right\s*\{([\s\S]*?)\n\}/,
    )?.[1];

    expect(leftKeyframes).toBeDefined();
    expect(rightKeyframes).toBeDefined();
    const openingTransforms = [
      leftOpenRule,
      rightOpenRule,
      leftKeyframes!,
      rightKeyframes!,
    ].join("\n");
    const nonZeroRotations = Array.from(
      openingTransforms.matchAll(
        /rotate\(\s*([-+]?\d*\.?\d+)(?:deg|rad|turn)\s*\)/g,
      ),
      (match) => Number(match[1]),
    ).filter((angle) => angle !== 0);
    expect(
      nonZeroRotations,
      "channel petals must not rotate while opening",
    ).toEqual([]);

    expect(leftOpenRule).toMatch(/transform:\s*translateX\(-6px\)\s*;/);
    expect(rightOpenRule).toMatch(/transform:\s*translateX\(6px\)\s*;/);
    expect(leftKeyframes).toMatch(
      /from\s*\{\s*transform:\s*translateX\(1px\)\s*;\s*\}\s*to\s*\{\s*transform:\s*translateX\(-6px\)\s*;/,
    );
    expect(rightKeyframes).toMatch(
      /from\s*\{\s*transform:\s*translateX\(-1px\)\s*;\s*\}\s*to\s*\{\s*transform:\s*translateX\(6px\)\s*;/,
    );
  });

  it("keeps four charge rows fixed around the two membrane lines", () => {
    expect(ruleBody(".ap-segment-charge--outside-top")).toMatch(
      /top:\s*-34px\s*;/,
    );
    expect(ruleBody(".ap-segment-charge--inside-top")).toMatch(
      /top:\s*22px\s*;/,
    );
    expect(ruleBody(".ap-segment-charge--inside-bottom")).toMatch(
      /bottom:\s*22px\s*;/,
    );
    expect(ruleBody(".ap-segment-charge--outside-bottom")).toMatch(
      /bottom:\s*-34px\s*;/,
    );
  });

  it("reserves three compartment lanes around a taller bilateral fiber", () => {
    expect(ruleBody(".ap-fiber")).toMatch(/height:\s*108px\s*;/);
    expect(ruleBody(".ap-compartment-label--outside-top")).toMatch(/47% - 42px/);
    expect(ruleBody(".ap-compartment-label--inside")).toMatch(/47% \+ 48px/);
    expect(ruleBody(".ap-compartment-label--outside-bottom")).toMatch(/47% \+ 126px/);
    expect(ruleBody(".ap-segment-charge--outside-top")).toMatch(/top:\s*-34px\s*;/);
    expect(ruleBody(".ap-segment-charge--inside-top")).toMatch(/top:\s*22px\s*;/);
    expect(ruleBody(".ap-segment-charge--inside-bottom")).toMatch(/bottom:\s*22px\s*;/);
    expect(ruleBody(".ap-segment-charge--outside-bottom")).toMatch(/bottom:\s*-34px\s*;/);
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

  it("maps both membrane surfaces to exact inward and outward travel directions", () => {
    const downwardRule = ruleBody(
      ".ap-ion-stream--top.ap-ion-stream--inward,\n.ap-ion-stream--bottom.ap-ion-stream--outward",
    );
    const upwardRule = ruleBody(
      ".ap-ion-stream--top.ap-ion-stream--outward,\n.ap-ion-stream--bottom.ap-ion-stream--inward",
    );

    for (const rule of [downwardRule, upwardRule]) {
      expect(rule).toMatch(/--ion-static-y:\s*(?:6|-20)px\s*;/);
    }
    expect(downwardRule).toMatch(/--ion-start-y:\s*-20px\s*;/);
    expect(downwardRule).toMatch(/--ion-end-y:\s*34px\s*;/);
    expect(downwardRule).toMatch(/--ion-static-y:\s*6px\s*;/);
    expect(upwardRule).toMatch(/--ion-start-y:\s*34px\s*;/);
    expect(upwardRule).toMatch(/--ion-end-y:\s*-20px\s*;/);
    expect(upwardRule).toMatch(/--ion-static-y:\s*-20px\s*;/);

    const sodiumRule = ruleBody(".ap-ion-stream--sodium");
    expect(sodiumRule).toMatch(/--ion-duration:\s*650ms\s*;/);
    expect(sodiumRule).toMatch(/--ion-stagger:\s*100ms\s*;/);
    expect(sodiumRule).toMatch(/--ion-iteration-count:\s*1\s*;/);
    expect(sodiumRule).toMatch(/--ion-fill-mode:\s*both\s*;/);

    const reducedMotionParticleRule = stylesheet.match(
      /@media \(prefers-reduced-motion: reduce\)[\s\S]*?\.ap-ion-particle\s*\{([^}]*)\}/,
    )?.[1];
    expect(reducedMotionParticleRule).toBeDefined();
    expect(reducedMotionParticleRule).toMatch(
      /transform:\s*translate\(calc\(-50% \+ var\(--ion-static-x\)\), var\(--ion-static-y\)\) scale\(\.9\)\s*;/,
    );
  });

  it("keeps paired potassium visuals on the shared boundary without overriding surface lanes", () => {
    const potassiumChannelRule = ruleBody(".ap-ion-channel--potassium");
    const potassiumStreamRule = ruleBody(".ap-ion-stream--potassium");

    expect(potassiumChannelRule).toMatch(/left:\s*100%\s*;/);
    expect(potassiumStreamRule).toMatch(/left:\s*100%\s*;/);
    for (const potassiumRule of [potassiumChannelRule, potassiumStreamRule]) {
      expect(potassiumRule).not.toMatch(/(?:top|bottom):/);
      expect(potassiumRule).not.toMatch(/--ion-(?:start|end)-y:/);
    }

    const mobilePotassiumChannelRule = stylesheet.match(
      /@media \(max-width:\s*720px\)[\s\S]*?\.ap-ion-channel--potassium\s*\{([^}]*)\}/,
    )?.[1];
    const mobilePotassiumParticleRule = stylesheet.match(
      /@media \(max-width:\s*720px\)[\s\S]*?\.ap-ion-stream--potassium \.ap-ion-particle\s*\{([^}]*)\}/,
    )?.[1];

    expect(mobilePotassiumChannelRule).toBeDefined();
    expect(mobilePotassiumChannelRule).toMatch(/--channel-scale:\s*\.52\s*;/);
    expect(mobilePotassiumParticleRule).toBeDefined();
    expect(mobilePotassiumParticleRule).toMatch(/width:\s*16px\s*;/);
    expect(mobilePotassiumParticleRule).toMatch(/height:\s*16px\s*;/);
    expect(mobilePotassiumParticleRule).toMatch(/font-size:\s*6px\s*;/);
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
