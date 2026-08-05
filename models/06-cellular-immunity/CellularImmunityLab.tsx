"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { CellularChart } from "./CellularChart";
import { CellularProcessView } from "./CellularProcessView";
import { CELLULAR_DURATION, getCellularSnapshot } from "./simulation";
import type {
  AntigenSpecificity,
  CellularCondition,
  CellularSettings,
  CellularStage,
  TargetType,
} from "./types";

const INITIAL_SETTINGS: CellularSettings = {
  target: "infected-a",
  tCellSpecificity: "A",
  exposure: "primary",
  memorySpecificity: "A",
  condition: "normal",
};
const CONDITIONS: Array<[CellularCondition, string]> = [
  ["normal", "正常流程"],
  ["presentation-blocked", "抗原呈递受阻"],
  ["helper-t-blocked", "辅助性 T 细胞受阻"],
  ["cytotoxic-t-missing", "缺少细胞毒性 T 细胞"],
  ["marker-mismatch", "标志不匹配"],
];
const STAGE_COPY: Record<
  CellularStage,
  { what: string; recognition: string; result: string }
> = {
  presentation: {
    what: "抗原呈递细胞展示来自感染细胞的抗原信息。",
    recognition: "辅助性 T 细胞读取被呈递的抗原信息。",
    result: "为后续 T 细胞活化准备信号。",
  },
  "helper-activation": {
    what: "辅助性 T 细胞被活化并提供协同信号。",
    recognition: "识别呈递的特异性抗原信息。",
    result: "促进匹配的细胞毒性 T 细胞活化。",
  },
  "cytotoxic-activation": {
    what: "匹配的细胞毒性 T 细胞获得效应功能。",
    recognition: "其受体保持对抗原 A 或 B 的特异性。",
    result: "准备克隆增殖和寻找靶细胞。",
  },
  "clonal-expansion": {
    what: "活化的细胞毒性 T 细胞选择性克隆增殖。",
    recognition: "所有后代保留相同的特异性受体。",
    result: "效应 T 细胞数量上升。",
  },
  "target-recognition": {
    what: "效应 T 细胞接近并检查靶细胞表面标志。",
    recognition: "只有受体和展示抗原标志匹配才形成有效接触。",
    result: "不匹配或正常细胞保持分离。",
  },
  "target-lysis": {
    what: "匹配的细胞毒性 T 细胞诱导感染靶细胞裂解。",
    recognition: "裂解针对展示匹配抗原的感染细胞，不针对正常细胞。",
    result: "靶细胞被清除；细胞毒性 T 细胞不直接吞噬病毒。",
  },
  memory: {
    what: "一部分细胞保留为免疫记忆。",
    recognition: "记忆只对相同抗原的再次进入发挥优势。",
    result: "二次匹配时反应更快、更强。",
  },
};
const STAGE_TITLES: Record<CellularStage, string> = {
  presentation: "抗原呈递",
  "helper-activation": "辅助性 T 细胞活化",
  "cytotoxic-activation": "细胞毒性 T 细胞活化",
  "clonal-expansion": "克隆增殖",
  "target-recognition": "特异性识别靶细胞",
  "target-lysis": "靶细胞裂解",
  memory: "保留免疫记忆",
};
const BLOCKED_COPY: Partial<
  Record<
    CellularCondition,
    { what: string; recognition: string; result: string }
  >
> = {
  "presentation-blocked": {
    what: "抗原信息没有被有效呈递。",
    recognition: "辅助性 T 细胞缺少可识别的呈递信息。",
    result: "细胞毒性 T 细胞不能完成活化和裂解。",
  },
  "helper-t-blocked": {
    what: "辅助性 T 细胞无法提供活化信号。",
    recognition: "没有充分的协同帮助。",
    result: "细胞毒性 T 细胞不能有效活化与裂解靶细胞。",
  },
  "cytotoxic-t-missing": {
    what: "缺少细胞毒性 T 细胞。",
    recognition: "即使上游信号存在，也没有执行特异性杀伤的细胞。",
    result: "不能执行靶细胞裂解。",
  },
  "marker-mismatch": {
    what: "靶细胞展示的标志与可识别标志不一致。",
    recognition: "受体与展示标志不匹配。",
    result: "停在识别阶段，不能形成有效接触或裂解。",
  },
};
const UNMATCHED_TARGET_COPY: Record<
  TargetType,
  { what: string; recognition: string; result: string }
> = {
  normal: {
    what: "这是正常细胞，未展示病毒抗原标志。",
    recognition: "细胞毒性 T 细胞受体没有匹配的抗原可识别。",
    result: "停在识别阶段；正常细胞保持分离，不裂解也不形成记忆。",
  },
  "infected-a": {
    what: "感染细胞 A 的抗原标志与所选 TCR 不匹配。",
    recognition: "受体只能特异识别相应的抗原标志。",
    result: "停在识别阶段；不形成有效接触、裂解或记忆。",
  },
  "infected-b": {
    what: "感染细胞 B 的抗原标志与所选 TCR 不匹配。",
    recognition: "受体只能特异识别相应的抗原标志。",
    result: "停在识别阶段；不形成有效接触、裂解或记忆。",
  },
};
function clamp(value: number) {
  return Math.max(0, Math.min(CELLULAR_DURATION, value));
}

export function CellularImmunityLab() {
  const [settings, setSettings] = useState<CellularSettings>(INITIAL_SETTINGS);
  const [time, setTime] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState<0.5 | 1 | 2>(1);
  const lastFrame = useRef<number | null>(null);
  const snapshot = useMemo(
    () => getCellularSnapshot(time, settings),
    [settings, time],
  );
  const recognitionLimited = snapshot.blockedAt === "target-recognition";
  const copy =
    recognitionLimited && settings.condition !== "marker-mismatch"
      ? UNMATCHED_TARGET_COPY[settings.target]
      : (BLOCKED_COPY[settings.condition] ?? STAGE_COPY[snapshot.stage]);
  const announcedStage = `${snapshot.blockedAt && !recognitionLimited ? "过程受阻：" : ""}${STAGE_TITLES[snapshot.stage]}`;

  useEffect(() => {
    if (!playing) return;
    let frame = 0;
    const tick = (now: number) => {
      const previous = lastFrame.current ?? now;
      lastFrame.current = now;
      setTime((current) => {
        const next = clamp(current + ((now - previous) / 1000) * speed);
        if (next >= CELLULAR_DURATION) setPlaying(false);
        return next;
      });
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(frame);
      lastFrame.current = null;
    };
  }, [playing, speed]);
  const changeSettings = (patch: Partial<CellularSettings>) => {
    setPlaying(false);
    setTime(0);
    setSettings((current) => ({ ...current, ...patch }));
  };
  const targetName = (target: TargetType) =>
    target === "infected-a"
      ? "感染细胞 A"
      : target === "infected-b"
        ? "感染细胞 B"
        : "正常细胞";
  const exposureText =
    settings.exposure === "secondary" && snapshot.memoryMatched
      ? "同种抗原二次免疫：记忆匹配，更快、更强。"
      : settings.exposure === "secondary"
        ? "二次进入但记忆不匹配：按初次反应。"
        : "初次免疫：建立免疫记忆。";

  return (
    <main className="cellular-shell" aria-labelledby="cellular-title">
      <header className="cellular-header">
        <p className="cellular-eyebrow">选择性必修 1 · 免疫调节</p>
        <h1 id="cellular-title">细胞免疫流程实验台</h1>
        <p>
          选择靶细胞、T 细胞特异性、免疫次数和干预条件，沿教学时间轴观察细胞毒性
          T 细胞如何特异性识别并裂解感染靶细胞。
        </p>
      </header>
      <p className="cellular-sr-only" aria-label={`阶段播报：${announcedStage}`} aria-live="polite" aria-atomic="true">
        当前阶段：{announcedStage}
      </p>
      <section className="cellular-grid">
        <CellularProcessView
          settings={settings}
          snapshot={snapshot}
          playing={playing}
        />
        <CellularChart settings={settings} snapshot={snapshot} time={time} />
        <section
          className="cellular-explanation"
          aria-label="当前阶段解释"
        >
          <p className="cellular-kicker">当前阶段解释</p>
          <h2>
            {snapshot.blockedAt && !recognitionLimited
              ? "过程受阻"
              : STAGE_COPY[snapshot.stage].what.split("。", 1)[0]}
          </h2>
          <dl>
            <div>
              <dt>发生了什么</dt>
              <dd>{copy.what}</dd>
            </div>
            <div>
              <dt>为什么能识别</dt>
              <dd>{copy.recognition}</dd>
            </div>
            <div>
              <dt>结果是什么</dt>
              <dd>{copy.result}</dd>
            </div>
          </dl>
          <p className="cellular-live-values">
            当前：效应 T 细胞 {snapshot.effectorCount}，靶细胞{" "}
            {snapshot.targetCount}，记忆 T 细胞 {snapshot.memoryCount}。靶细胞：
            {targetName(settings.target)}。
          </p>
        </section>
      </section>
      <section className="cellular-controls" aria-label="实验控制台">
        <div className="cellular-control-groups">
          <fieldset>
            <legend>靶细胞类型</legend>
            <div className="cellular-button-row">
              {(["infected-a", "infected-b", "normal"] as TargetType[]).map(
                (target) => (
                  <button
                    className="cellular-button"
                    key={target}
                    aria-pressed={settings.target === target}
                    onClick={() => changeSettings({ target })}
                  >
                    {targetName(target)}
                  </button>
                ),
              )}
            </div>
          </fieldset>
          <fieldset>
            <legend>细胞毒性 T 细胞受体</legend>
            <div className="cellular-button-row">
              {(["A", "B"] as AntigenSpecificity[]).map((value) => (
                <button
                  className="cellular-button"
                  key={value}
                  aria-pressed={settings.tCellSpecificity === value}
                  onClick={() => changeSettings({ tCellSpecificity: value })}
                >
                  TCR {value}
                </button>
              ))}
            </div>
          </fieldset>
          <fieldset>
            <legend>暴露次数</legend>
            <div className="cellular-button-row">
              <button
                className="cellular-button"
                aria-pressed={settings.exposure === "primary"}
                onClick={() => changeSettings({ exposure: "primary" })}
              >
                初次免疫
              </button>
              <button
                className="cellular-button"
                aria-pressed={settings.exposure === "secondary"}
                onClick={() => changeSettings({ exposure: "secondary" })}
              >
                二次免疫
              </button>
            </div>
          </fieldset>
          <fieldset>
            <legend>既往记忆特异性</legend>
            <div className="cellular-button-row">
              {(["A", "B"] as AntigenSpecificity[]).map((value) => (
                <button
                  className="cellular-button"
                  key={value}
                  aria-pressed={settings.memorySpecificity === value}
                  onClick={() => changeSettings({ memorySpecificity: value })}
                >
                  记忆 {value}
                </button>
              ))}
            </div>
          </fieldset>
          <fieldset className="cellular-condition-group">
            <legend>实验干预</legend>
            <div className="cellular-button-row">
              {CONDITIONS.map(([condition, label]) => (
                <button
                  className="cellular-button"
                  key={condition}
                  aria-pressed={settings.condition === condition}
                  onClick={() => changeSettings({ condition })}
                >
                  {label}
                </button>
              ))}
            </div>
          </fieldset>
        </div>
        <p className="cellular-setting-status">
          {exposureText} 切换条件会暂停并归零本次演示。
        </p>
        <label className="cellular-timeline">
          <span>教学时间</span>
          <input
            aria-label="教学时间"
            type="range"
            min="0"
            max={CELLULAR_DURATION}
            step="0.1"
            value={time}
            onChange={(event) => {
              setPlaying(false);
              setTime(clamp(Number(event.target.value)));
            }}
          />
          <output>{time.toFixed(1)} 时间单位</output>
        </label>
        <div className="cellular-button-row cellular-transport">
          <button
            className="cellular-button primary"
            onClick={() => {
              setTime(0);
              setPlaying(true);
            }}
          >
            开始演示
          </button>
          <button
            className="cellular-button"
            onClick={() => {
              if (time >= CELLULAR_DURATION) setTime(0);
              setPlaying((current) => !current);
            }}
          >
            {playing ? "暂停" : "播放"}
          </button>
          <button
            className="cellular-button"
            disabled={time <= 0}
            onClick={() => {
              setPlaying(false);
              setTime((value) => clamp(value - 0.5));
            }}
          >
            上一步
          </button>
          <button
            className="cellular-button"
            disabled={time >= CELLULAR_DURATION}
            onClick={() => {
              setPlaying(false);
              setTime((value) => clamp(value + 0.5));
            }}
          >
            下一步
          </button>
          {([0.5, 1, 2] as const).map((value) => (
            <button
              className="cellular-button"
              key={value}
              aria-pressed={speed === value}
              onClick={() => {
                setPlaying(false);
                setSpeed(value);
              }}
            >
              {value === 0.5 ? "慢速" : value === 1 ? "正常" : "快速"}
            </button>
          ))}
          <button
            className="cellular-button"
            onClick={() => {
              setPlaying(false);
              setTime(0);
              setSettings(INITIAL_SETTINGS);
            }}
          >
            重置
          </button>
        </div>
        <p className="cellular-note">
          时间、效应细胞数和靶细胞数均为教学示意，用于理解特异性识别、克隆扩增与靶细胞裂解之间的因果关系。
        </p>
      </section>
    </main>
  );
}
