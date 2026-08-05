import type {
  CurveAnswer,
  CurveAnswerCheck,
  CurveIntensity,
  CurveSnapshot,
  CurveStage,
} from "./types";

const STAGE_ANSWERS: Record<CurveStage, CurveAnswer> = {
  resting: {
    stage: "resting",
    ionFlow: "none",
    insidePolarity: "negative",
  },
  local: {
    stage: "local",
    ionFlow: "none",
    insidePolarity: "negative",
  },
  threshold: {
    stage: "threshold",
    ionFlow: "none",
    insidePolarity: "negative",
  },
  depolarization: {
    stage: "depolarization",
    ionFlow: "sodium-in",
    insidePolarity: "positive",
  },
  peak: {
    stage: "peak",
    ionFlow: "none",
    insidePolarity: "positive",
  },
  repolarization: {
    stage: "repolarization",
    ionFlow: "potassium-out",
    insidePolarity: "negative",
  },
  recovery: {
    stage: "recovery",
    ionFlow: "potassium-out",
    insidePolarity: "negative",
  },
};

const STAGE_EXPLANATIONS: Record<CurveStage, string> = {
  resting: "静息期：无主要离子跨膜流动，膜内相对为负、膜外相对为正。",
  local: "局部电位期：刺激未达阈值，无主要离子跨膜流动，膜内仍相对为负、膜外相对为正。",
  threshold: "阈电位：膜内仍相对为负、膜外相对为正，达到阈值后将触发Na⁺内流。",
  depolarization: "去极化期：Na⁺大量内流，膜内由负变正、膜外相对为负。",
  peak: "峰值期：Na⁺内流已停止且K⁺外流尚未成为主要运动，膜内相对为正、膜外相对为负。",
  repolarization: "复极化期：K⁺外流，膜内恢复为相对负、膜外相对正。",
  recovery: "恢复期：K⁺继续外流后逐渐恢复静息状态，膜内相对为负、膜外相对为正。",
};

function interpolate(
  time: number,
  startTime: number,
  endTime: number,
  startMv: number,
  endMv: number,
): number {
  return startMv + ((time - startTime) / (endTime - startTime)) * (endMv - startMv);
}

function getActionPotentialStage(time: number): CurveStage {
  if (time < 1) return "resting";
  if (time < 2) return "threshold";
  if (time < 3) return "depolarization";
  if (time < 4) return "peak";
  if (time < 5) return "repolarization";
  if (time < 6) return "recovery";
  return "resting";
}

function getActionPotentialMv(time: number, stage: CurveStage): number {
  switch (stage) {
    case "threshold":
      return interpolate(time, 1, 2, -70, -55);
    case "depolarization":
      return interpolate(time, 2, 3, -55, 30);
    case "peak":
      return 30;
    case "repolarization":
      return interpolate(time, 4, 5, 30, -80);
    case "recovery":
      return interpolate(time, 5, 6, -80, -70);
    default:
      return -70;
  }
}

function getWeakSnapshot(time: number): CurveSnapshot {
  const stage: CurveStage = time >= 1 && time < 4 ? "local" : "resting";
  const answer = STAGE_ANSWERS[stage];

  return {
    ...answer,
    mv: stage === "local" ? -60 : -70,
    sodiumOpen: false,
    potassiumOpen: false,
  };
}

export function getCurveSnapshot(
  time: number,
  intensity: CurveIntensity,
): CurveSnapshot {
  if (intensity === "weak") return getWeakSnapshot(time);

  const stage = getActionPotentialStage(time);
  const answer = STAGE_ANSWERS[stage];

  return {
    ...answer,
    mv: getActionPotentialMv(time, stage),
    sodiumOpen: stage === "depolarization",
    potassiumOpen: stage === "repolarization" || stage === "recovery",
  };
}

export function checkCurveAnswer(
  stage: CurveStage,
  answer: CurveAnswer,
): CurveAnswerCheck {
  const expected = STAGE_ANSWERS[stage];

  return {
    correct:
      answer.stage === expected.stage &&
      answer.ionFlow === expected.ionFlow &&
      answer.insidePolarity === expected.insidePolarity,
    expected: { ...expected },
    explanation: STAGE_EXPLANATIONS[stage],
  };
}

export type {
  CurveAnswer,
  CurveAnswerCheck,
  CurveIntensity,
  CurveSnapshot,
  CurveStage,
  InsidePolarity,
  IonFlow,
} from "./types";
