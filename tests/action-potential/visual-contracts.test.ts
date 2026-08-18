import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { MODE_DURATION_MS } from "../../components/action-potential/modeData";
import {
  CONDUCTION_ACTION_POTENTIAL_MS,
  CONDUCTION_LOCAL_CURRENT_MS,
  getActionPotentialFrame,
  getConductionStepFrame,
} from "../../components/action-potential/simulation";

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
  it("drifts free ions slowly with pause, conduction, mobile, and reduced-motion rules", () => {
    const ionRule = ruleBody(".ap-free-ion");
    const runningRule = ruleBody(
      '.ap-scene[data-playing="true"] .ap-free-ion,\n.ap-scene--conduction .ap-free-ion',
    );
    const keyframes = stylesheet.match(
      /@keyframes ap-free-ion-drift\s*\{([\s\S]*?)\n\}/,
    )?.[1];

    expect(ionRule).toMatch(
      /animation:\s*ap-free-ion-drift var\(--free-ion-drift-duration\) ease-in-out infinite/,
    );
    expect(ionRule).toMatch(/animation-delay:\s*var\(--free-ion-drift-delay\)/);
    expect(ionRule).toMatch(/animation-play-state:\s*paused/);
    expect(runningRule).toMatch(/animation-play-state:\s*running/);
    expect(keyframes).toBeDefined();
    expect(keyframes).toMatch(/var\(--free-ion-active-drift-x\)/);
    expect(keyframes).toMatch(/var\(--free-ion-active-drift-y\)/);

    const mobileRule = stylesheet.match(
      /@media \(max-width:\s*720px\)[\s\S]*?\.ap-free-ion\s*\{([^}]*)\}/,
    )?.[1];
    expect(mobileRule).toMatch(
      /--free-ion-active-drift-x:\s*var\(--free-ion-mobile-drift-x\)/,
    );
    expect(mobileRule).toMatch(
      /--free-ion-active-drift-y:\s*var\(--free-ion-mobile-drift-y\)/,
    );

    const reducedRule = stylesheet.match(
      /@media \(prefers-reduced-motion:\s*reduce\)[\s\S]*?\.ap-free-ion\s*\{([^}]*)\}/,
    )?.[1];
    expect(reducedRule).toBeDefined();
    expect(reducedRule).toMatch(/animation:\s*none/);
    expect(reducedRule).toMatch(/transform:\s*translate\(-50%,\s*-50%\)/);
  });

  it("places mobile controls between the scene and knowledge card", () => {
    const layoutRule = ruleBody(".ap-layout");
    const sceneRule = ruleBody(".ap-scene");
    const controlsRules = Array.from(
      stylesheet.matchAll(/\.ap-controls\s*\{([^}]*)\}/g),
      (match) => match[1],
    );
    const knowledgeRule = ruleBody(".ap-knowledge");
    const mobileRules = stylesheet.match(
      /@media \(max-width: 720px\) \{([\s\S]*?)\n\}/,
    )?.[1];

    expect(layoutRule).toMatch(
      /grid-template-areas:\s*"scene knowledge"\s*"controls controls"/,
    );
    expect(sceneRule).toMatch(/grid-area:\s*scene/);
    expect(controlsRules.some((rule) => /grid-area:\s*controls/.test(rule))).toBe(
      true,
    );
    expect(knowledgeRule).toMatch(/grid-area:\s*knowledge/);
    expect(mobileRules).toBeDefined();
    expect(mobileRules).toMatch(
      /\.ap-layout\s*\{[^}]*grid-template-areas:\s*"scene"\s*"controls"\s*"knowledge"/s,
    );
    expect(mobileRules).toMatch(
      /\.ap-control\s*\{[^}]*min-height:\s*44px/s,
    );
    expect(mobileRules).not.toMatch(/position:\s*(?:fixed|sticky)/);
  });

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
      /stroke-dasharray:\s*1\s*;/,
    );
    expect(ruleBody(".ap-current-arc")).toMatch(/stroke-dashoffset:\s*1\s*;/);
    expect(ruleBody(".ap-current-arc")).toMatch(
      /animation:\s*ap-current-draw 520ms[^;]+1 forwards\s*;/,
    );
    expect(ruleBody(".ap-current-arc")).toMatch(
      /animation-delay:\s*calc\(var\(--arc-index\) \* 60ms\)\s*;/,
    );
    expect(ruleBody(".ap-current-arc")).not.toMatch(/infinite/);
    expect(ruleBody('.ap-current-arc[data-current-drawing="false"]')).toMatch(
      /stroke-dashoffset:\s*0\s*;/,
    );
    expect(stylesheet).not.toMatch(
      /\.ap-local-current-system\[data-current-step=/,
    );
  });

  it("centers the terminal conclusion without decorative arrow content", () => {
    const conclusionRule = ruleBody(".ap-bidirectional");
    expect(conclusionRule).toMatch(/left:\s*50%\s*;/);
    expect(conclusionRule).toMatch(/width:\s*92%\s*;/);
    expect(conclusionRule).toMatch(/max-width:\s*720px\s*;/);
    expect(conclusionRule).toMatch(/line-height:\s*1\.45\s*;/);
    expect(conclusionRule).toMatch(/translateX\(-50%\)/);
    expect(stylesheet).not.toMatch(
      /\.ap-bidirectional::(?:before|after)/,
    );
  });

  it("keeps current arcs above membrane fills but behind charges, channels, and ions", () => {
    const currentLayer = zIndex(".ap-local-current-system");

    expect(currentLayer).toBeGreaterThan(0);
    expect(currentLayer).toBeLessThan(zIndex(".ap-segment-charge"));
    expect(currentLayer).toBeLessThan(zIndex(".ap-ion-channel"));
    expect(currentLayer).toBeLessThan(zIndex(".ap-ion-stream"));
  });

  it("keeps free ions below teaching overlays and compact on mobile", () => {
    const distributionRule = ruleBody(".ap-free-ion-distribution");
    const ionRule = ruleBody(".ap-free-ion");
    const currentLayer = zIndex(".ap-local-current-system");

    expect(distributionRule).toMatch(/position:\s*absolute/);
    expect(distributionRule).toMatch(/inset:\s*0/);
    expect(distributionRule).toMatch(/z-index:\s*1/);
    expect(distributionRule).toMatch(/pointer-events:\s*none/);
    expect(ionRule).toMatch(/animation-play-state:\s*paused/);
    expect(1).toBeLessThan(currentLayer);
    expect(1).toBeLessThan(zIndex(".ap-segment-charge"));
    expect(1).toBeLessThan(zIndex(".ap-ion-channel"));
    expect(1).toBeLessThan(zIndex(".ap-ion-stream"));

    const mobileIonRule = stylesheet.match(
      /@media \(max-width:\s*720px\)[\s\S]*?\.ap-free-ion\s*\{([^}]*)\}/,
    )?.[1];
    expect(mobileIonRule).toBeDefined();
    expect(mobileIonRule).toMatch(/width:\s*14px/);
    expect(mobileIonRule).toMatch(/height:\s*14px/);
    expect(mobileIonRule).toMatch(/font-size:\s*5px/);
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
      /transform:\s*translate\(-50%, calc\(var\(--ion-static-y\) \+ var\(--ion-static-offset-y\)\)\) scale\(\.9\)\s*;/,
    );
    expect(stylesheet).not.toMatch(/--ion-static-x/);
  });

  it("aligns charges, sodium channels, and sodium transport on one centerline", () => {
    expect(ruleBody(".ap-segment-charge")).toMatch(/left:\s*50%\s*;/);
    expect(ruleBody(".ap-ion-channel")).toMatch(/left:\s*50%\s*;/);
    expect(ruleBody(".ap-ion-stream")).toMatch(/left:\s*50%\s*;/);
    expect(ruleBody(".ap-ion-channel--potassium")).toMatch(
      /left:\s*100%\s*;/,
    );
    expect(ruleBody(".ap-ion-stream--potassium")).toMatch(
      /left:\s*100%\s*;/,
    );
    expect(stylesheet).not.toMatch(/--ion-bypass-x/);
    expect(stylesheet).not.toMatch(/ap-sodium-bypass-(?:up|down)/);
  });

  it("keeps the aligned stimulus above the sodium pore", () => {
    const stimulusRule = ruleBody(".ap-stimulus");
    expect(stimulusRule).toMatch(/left:\s*50%\s*;/);
    expect(stimulusRule).toMatch(/top:\s*-82px\s*;/);
    expect(stimulusRule).toMatch(/height:\s*64px\s*;/);
    expect(stimulusRule).toMatch(/transform:\s*translateX\(-50%\)\s*;/);
  });

  it("moves sodium on the same vertical axis as its pore", () => {
    const particleRule = ruleBody(".ap-ion-particle");
    expect(particleRule).toMatch(
      /transform:\s*translate\(-50%,\s*var\(--ion-start-y\)\) scale\(\.82\)/,
    );
    expect(particleRule).not.toMatch(/translate:\s*var\(--ion-bypass-x\)/);
    expect(ruleBody(".ap-ion-stream--sodium")).not.toMatch(/animation-name:/);
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
    const influxDuration = 1150 - 300;
    const lastSodiumCompletion = sodiumDuration + 2 * sodiumStagger;

    expect(CONDUCTION_LOCAL_CURRENT_MS).toBe(700);
    expect(CONDUCTION_ACTION_POTENTIAL_MS).toBe(1400);
    expect(getConductionStepFrame(1, 1).phase).toBe("local-current");
    expect(getConductionStepFrame(2, 300 / 1400).phase).toBe(
      "neighbor-sodium-in",
    );
    expect(getConductionStepFrame(2, 1150 / 1400).phase).toBe(
      "neighbor-excited",
    );
    expect(influxDuration).toBeGreaterThanOrEqual(850);
    expect(influxDuration).toBeLessThanOrEqual(1000);
    expect(influxDuration - lastSodiumCompletion).toBeGreaterThanOrEqual(0);
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
