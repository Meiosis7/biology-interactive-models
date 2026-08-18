import { readFileSync } from "node:fs";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ActionPotentialKnowledgeCard } from "../../components/action-potential/ActionPotentialKnowledgeCard";
import { ActionPotentialModeNav } from "../../components/action-potential/ActionPotentialModeNav";
import { ActionPotentialScene } from "../../components/action-potential/ActionPotentialScene";
import { ACTION_POTENTIAL_MODES } from "../../components/action-potential/modeData";
import {
  getActionPotentialFrame,
  getConductionStepFrame,
} from "../../components/action-potential/simulation";

describe("action-potential shared-fiber components", () => {
  it("uses the approved ion and relay teaching summaries", () => {
    expect(ACTION_POTENTIAL_MODES[0].summary).toContain("K⁺外流");
    expect(ACTION_POTENTIAL_MODES[1].summary).toBe(
      "刺激使局部 Na⁺通道开放，Na⁺内流，受刺激部位膜外为负、膜内为正。",
    );
    expect(ACTION_POTENTIAL_MODES[1].facts[2]).toEqual({
      label: "结果",
      value: "受刺激部位膜外为负、膜内为正",
    });
    expect(ACTION_POTENTIAL_MODES[2].facts[0]).toEqual({
      label: "原因",
      value: "兴奋部位与未兴奋部位之间形成局部电流",
    });
    expect(ACTION_POTENTIAL_MODES[2].summary).toContain(
      "神经冲动以电信号（局部电流）的形式在神经纤维上双向传导。",
    );
    expect(ACTION_POTENTIAL_MODES[2].facts[2]).toEqual({
      label: "结果",
      value: "神经冲动以电信号（局部电流）的形式在神经纤维上双向传导。",
    });
    expect(JSON.stringify(ACTION_POTENTIAL_MODES)).not.toMatch(
      /曲线|mV|−70|-70|复极化|超极化|恢复/,
    );
    expect(JSON.stringify(ACTION_POTENTIAL_MODES)).not.toMatch(
      /中央|外负内正/,
    );
  });

  it("announces the selected mode and reports clicks", () => {
    const onModeChange = vi.fn();
    render(
      <ActionPotentialModeNav mode="resting" onModeChange={onModeChange} />,
    );
    expect(screen.getByRole("button", { name: "静息电位" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    fireEvent.click(screen.getByRole("button", { name: "动作电位产生" }));
    expect(onModeChange).toHaveBeenCalledWith("generation");
  });

  it("preserves one shared fiber node while mode overlays change", () => {
    const { container, rerender } = render(
      <ActionPotentialScene
        mode="resting"
        frame={getActionPotentialFrame("resting", 0.2)}
        playing
      />,
    );
    const sharedFiber = screen.getByTestId("shared-fiber");
    const centralSegment = container.querySelector('[data-segment-id="3"]');
    expect(screen.getAllByTestId("shared-fiber")).toHaveLength(1);
    rerender(
      <ActionPotentialScene
        mode="generation"
        frame={getActionPotentialFrame("generation", 1)}
        playing={false}
      />,
    );
    expect(screen.getByTestId("shared-fiber")).toBe(sharedFiber);
    expect(container.querySelector('[data-segment-id="3"]')).toBe(
      centralSegment,
    );
    expect(
      screen.getByLabelText("第4膜段膜外为负、膜内为正"),
    ).toBeInTheDocument();
    expect(screen.queryByText("K⁺外流")).not.toBeInTheDocument();
    expect(screen.queryByText(/恢复/)).not.toBeInTheDocument();
  });

  it("keeps pauseable channel and membrane nodes mounted across play-state changes", () => {
    const openingFrame = getActionPotentialFrame("generation", 0.2);
    const { container, rerender } = render(
      <ActionPotentialScene
        mode="generation"
        frame={openingFrame}
        playing
      />,
    );
    const scene = screen.getByLabelText("动作电位产生动态示意");
    const centralSegment = container.querySelector('[data-segment-id="3"]');
    const leftPetal = centralSegment?.querySelector(
      '[data-channel-petal="left"]',
    );
    const pore = centralSegment?.querySelector("[data-channel-pore]");

    rerender(
      <ActionPotentialScene
        mode="generation"
        frame={openingFrame}
        playing={false}
      />,
    );
    expect(scene).toHaveAttribute("data-playing", "false");
    expect(container.querySelector('[data-segment-id="3"]')).toBe(
      centralSegment,
    );
    expect(
      centralSegment?.querySelector('[data-channel-petal="left"]'),
    ).toBe(leftPetal);
    expect(centralSegment?.querySelector("[data-channel-pore]")).toBe(pore);

    rerender(
      <ActionPotentialScene
        mode="generation"
        frame={getActionPotentialFrame("generation", 0.9)}
        playing
      />,
    );
    expect(scene).toHaveAttribute("data-playing", "true");
    expect(container.querySelector('[data-segment-id="3"]')).toBe(
      centralSegment,
    );
  });

  it("renders seven semantic segments inside one shared fiber", () => {
    const { container } = render(
      <ActionPotentialScene
        mode="resting"
        frame={getActionPotentialFrame("resting", 0)}
        playing
      />,
    );
    expect(screen.getAllByTestId("shared-fiber")).toHaveLength(1);
    expect(container.querySelectorAll("[data-segment-id]")).toHaveLength(7);
    expect(
      container.querySelectorAll('[data-segment-polarity="resting"]'),
    ).toHaveLength(7);
    expect(
      container.querySelectorAll('[data-channel-species="sodium"]'),
    ).toHaveLength(14);
  });

  it("renders stable top and bottom sodium channels for every segment", () => {
    const { container } = render(
      <ActionPotentialScene
        mode="resting"
        frame={getActionPotentialFrame("resting", 0)}
        playing
      />,
    );
    expect(
      container.querySelectorAll('[data-channel-species="sodium"]'),
    ).toHaveLength(14);
    for (let id = 0; id < 7; id += 1) {
      const segment = container.querySelector(`[data-segment-id="${id}"]`)!;
      expect(
        segment.querySelectorAll(
          '[data-channel-species="sodium"][data-membrane-surface="top"]',
        ),
      ).toHaveLength(1);
      expect(
        segment.querySelectorAll(
          '[data-channel-species="sodium"][data-membrane-surface="bottom"]',
        ),
      ).toHaveLength(1);
    }
  });

  it("opens both central sodium channels and sends six ions inward", () => {
    const { container } = render(
      <ActionPotentialScene
        mode="generation"
        frame={getActionPotentialFrame("generation", 0.55)}
        playing
      />,
    );
    const center = container.querySelector('[data-segment-id="3"]')!;
    expect(
      center.querySelectorAll(
        '[data-channel-species="sodium"][data-open="true"]',
      ),
    ).toHaveLength(2);
    expect(
      center.querySelectorAll('[data-ion-species="sodium"]'),
    ).toHaveLength(2);
    expect(
      center.querySelectorAll('[data-ion-particle="sodium"]'),
    ).toHaveLength(6);
    expect(
      screen.getByLabelText("Na⁺经第4膜段上膜进入膜内"),
    ).toHaveAttribute("data-screen-direction", "down");
    expect(
      screen.getByLabelText("Na⁺经第4膜段下膜进入膜内"),
    ).toHaveAttribute("data-screen-direction", "up");
  });

  it("keeps each sodium stream on the same surface and segment as its channel", () => {
    const { container } = render(
      <ActionPotentialScene
        mode="generation"
        frame={getActionPotentialFrame("generation", 0.55)}
        playing
      />,
    );
    const center = container.querySelector('[data-segment-id="3"]')!;
    for (const surface of ["top", "bottom"]) {
      expect(
        center.querySelector(
          `[data-channel-species="sodium"][data-membrane-surface="${surface}"]`,
        ),
      ).toBeTruthy();
      expect(
        center.querySelector(
          `[data-ion-species="sodium"][data-membrane-surface="${surface}"]`,
        ),
      ).toBeTruthy();
    }
  });

  it("mirrors sodium influx on every conduction target", () => {
    const { container } = render(
      <ActionPotentialScene
        mode="conduction"
        frame={getConductionStepFrame(2, 0.5)}
        playing
      />,
    );
    expect(
      container.querySelectorAll(
        '[data-channel-species="sodium"][data-open="true"]',
      ),
    ).toHaveLength(4);
    expect(
      container.querySelectorAll('[data-ion-species="sodium"]'),
    ).toHaveLength(4);
    expect(
      container.querySelectorAll('[data-ion-particle="sodium"]'),
    ).toHaveLength(12);
  });

  it("renders four vertically ordered charges for every resting segment", () => {
    const { container } = render(
      <ActionPotentialScene
        mode="resting"
        frame={getActionPotentialFrame("resting", 0)}
        playing
      />,
    );

    const segment = container.querySelector('[data-segment-id="3"]')!;
    const charges = Array.from(
      segment.querySelectorAll<HTMLElement>("[data-charge-position]"),
    );
    expect(charges.map((charge) => charge.dataset.chargePosition)).toEqual([
      "outside-top",
      "inside-top",
      "inside-bottom",
      "outside-bottom",
    ]);
    expect(charges.map((charge) => charge.textContent)).toEqual([
      "＋",
      "−",
      "−",
      "＋",
    ]);
  });

  it("labels top outside, fiber inside, and bottom outside in vertical order", () => {
    render(
      <ActionPotentialScene
        mode="generation"
        frame={getActionPotentialFrame("generation", 0.55)}
        playing={false}
      />,
    );

    const labels = screen.getAllByTestId("membrane-compartment-label");
    expect(labels.map((label) => label.getAttribute("data-compartment"))).toEqual([
      "outside-top",
      "inside",
      "outside-bottom",
    ]);
    expect(labels.map((label) => label.textContent)).toEqual(["膜外", "膜内", "膜外"]);
  });

  it.each([
    [0, ["＋", "−", "−", "＋"]],
    [0.2, ["＋", "−", "−", "＋"]],
    [0.55, ["＋", "−", "−", "＋"]],
    [0.9, ["−", "＋", "＋", "−"]],
  ] as const)("keeps the generation charge quartet atomic at progress %s", (progress, expected) => {
    const { container } = render(
      <ActionPotentialScene
        mode="generation"
        frame={getActionPotentialFrame("generation", progress)}
        playing={false}
      />,
    );
    const center = container.querySelector('[data-segment-id="3"]')!;
    expect(
      Array.from(center.querySelectorAll("[data-charge-position]"), (node) => node.textContent),
    ).toEqual(expected);
  });

  it("switches conduction targets only after sodium influx finishes", () => {
    const { container, rerender } = render(
      <ActionPotentialScene
        mode="conduction"
        frame={getConductionStepFrame(2, 0.5)}
        playing={false}
      />,
    );
    const signs = (id: number) =>
      Array.from(
        container.querySelector(`[data-segment-id="${id}"]`)!.querySelectorAll("[data-charge-position]"),
        (node) => node.textContent,
      );
    expect(signs(2)).toEqual(["＋", "−", "−", "＋"]);
    expect(signs(4)).toEqual(["＋", "−", "−", "＋"]);

    rerender(
      <ActionPotentialScene
        mode="conduction"
        frame={getConductionStepFrame(2, 1)}
        playing={false}
      />,
    );
    expect(signs(2)).toEqual(["−", "＋", "＋", "−"]);
    expect(signs(4)).toEqual(["−", "＋", "＋", "−"]);
  });

  it("reverses all four charge signs without moving their slots when excited", () => {
    const { container } = render(
      <ActionPotentialScene
        mode="generation"
        frame={getActionPotentialFrame("generation", 0.9)}
        playing={false}
      />,
    );

    const segment = container.querySelector('[data-segment-id="3"]')!;
    const charges = Array.from(
      segment.querySelectorAll<HTMLElement>("[data-charge-position]"),
    );
    expect(charges.map((charge) => charge.dataset.chargePosition)).toEqual([
      "outside-top",
      "inside-top",
      "inside-bottom",
      "outside-bottom",
    ]);
    expect(charges.map((charge) => charge.textContent)).toEqual([
      "−",
      "＋",
      "＋",
      "−",
    ]);
  });

  it("opens and excites only the central segment during generation", () => {
    const { container, rerender } = render(
      <ActionPotentialScene
        mode="generation"
        frame={getActionPotentialFrame("generation", 0.25)}
        playing
      />,
    );
    expect(
      container.querySelectorAll(
        '[data-channel-species="sodium"][data-open="true"]',
      ),
    ).toHaveLength(2);
    expect(
      container.querySelector(
        '[data-segment-id="3"] [data-channel-species="sodium"]',
      ),
    ).toHaveAttribute("data-open", "true");
    rerender(
      <ActionPotentialScene
        mode="generation"
        frame={getActionPotentialFrame("generation", 0.9)}
        playing={false}
      />,
    );
    expect(
      container.querySelectorAll('[data-segment-polarity="excited"]'),
    ).toHaveLength(1);
    expect(container.querySelector('[data-segment-id="3"]')).toHaveAttribute(
      "data-segment-polarity",
      "excited",
    );
  });

  it("builds every ion channel from left and right petals around one pore", () => {
    const { container } = render(
      <ActionPotentialScene
        mode="generation"
        frame={getActionPotentialFrame("generation", 0.25)}
        playing
      />,
    );

    const channel = container.querySelector(
      '[data-segment-id="3"] [data-channel-species="sodium"]',
    );
    expect(channel).toHaveAttribute("data-open", "true");
    expect(channel?.querySelectorAll('[data-channel-petal]')).toHaveLength(2);
    expect(channel?.querySelector('[data-channel-petal="left"]')).toBeTruthy();
    expect(channel?.querySelector('[data-channel-petal="right"]')).toBeTruthy();
    expect(channel?.querySelector('[data-channel-pore]')).toBeTruthy();
    expect(channel?.querySelector('[data-channel-petal="top"]')).toBeNull();
    expect(channel?.querySelector('[data-channel-petal="bottom"]')).toBeNull();
  });

  it("uses the same horizontal-petal channel structure for potassium", () => {
    const { container } = render(
      <ActionPotentialScene
        mode="resting"
        frame={getActionPotentialFrame("resting", 0.2)}
        playing
      />,
    );

    const potassium = container.querySelector(
      '[data-channel-species="potassium"]',
    );
    expect(potassium).toHaveAttribute("data-open", "true");
    expect(potassium?.querySelectorAll('[data-channel-petal]')).toHaveLength(2);
    expect(
      potassium?.querySelector('[data-channel-petal="left"]'),
    ).toBeTruthy();
    expect(
      potassium?.querySelector('[data-channel-petal="right"]'),
    ).toBeTruthy();
  });

  it("positions potassium outflow at a continuous membrane segment boundary on both surfaces", () => {
    const stylesheet = readFileSync(
      "components/action-potential/action-potential.css",
      "utf8",
    );

    expect(stylesheet).toMatch(
      /\.ap-ion-channel--potassium\s*\{[^}]*left:\s*100%;/s,
    );
    expect(stylesheet).toMatch(
      /\.ap-ion-channel--top\s*\{[^}]*top:\s*-15px;[^}]*bottom:\s*auto;/s,
    );
    expect(stylesheet).toMatch(
      /\.ap-ion-channel--bottom\s*\{[^}]*top:\s*auto;[^}]*bottom:\s*-15px;/s,
    );
    expect(stylesheet).toMatch(
      /\.ap-ion-stream--top\s*\{[^}]*top:\s*-18px;[^}]*bottom:\s*auto;/s,
    );
    expect(stylesheet).toMatch(
      /\.ap-ion-stream--bottom\s*\{[^}]*top:\s*auto;[^}]*bottom:\s*-18px;/s,
    );
    expect(stylesheet).toMatch(
      /\.ap-ion-stream--potassium\s*\{[^}]*left:\s*100%;/s,
    );
  });

  it("shows paired potassium channels and opposite outward screen directions only while resting", () => {
    const { container, rerender } = render(
      <ActionPotentialScene
        mode="resting"
        frame={getActionPotentialFrame("resting", 0.2)}
        playing
      />,
    );

    expect(
      container.querySelectorAll('[data-channel-species="potassium"]'),
    ).toHaveLength(2);
    expect(
      container.querySelectorAll('[data-ion-species="potassium"]'),
    ).toHaveLength(2);
    expect(
      container.querySelectorAll('[data-ion-particle="potassium"]'),
    ).toHaveLength(6);
    expect(screen.getByLabelText("K⁺经上膜向膜外流出")).toHaveAttribute(
      "data-screen-direction",
      "up",
    );
    expect(screen.getByLabelText("K⁺经下膜向膜外流出")).toHaveAttribute(
      "data-screen-direction",
      "down",
    );

    rerender(
      <ActionPotentialScene
        mode="generation"
        frame={getActionPotentialFrame("generation", 0.55)}
        playing
      />,
    );
    expect(
      container.querySelectorAll('[data-channel-species="potassium"]'),
    ).toHaveLength(0);
    expect(
      container.querySelectorAll('[data-ion-particle="potassium"]'),
    ).toHaveLength(0);
  });

  it("renders three staggerable sodium particles through the active pore", () => {
    const { container } = render(
      <ActionPotentialScene
        mode="generation"
        frame={getActionPotentialFrame("generation", 0.55)}
        playing
      />,
    );

    const stream = screen.getByLabelText("Na⁺经第4膜段上膜进入膜内");
    expect(stream).toHaveAttribute("data-ion-direction", "inward");
    expect(stream).toHaveAttribute("data-ion-species", "sodium");
    expect(
      stream.querySelectorAll('[data-ion-particle="sodium"]'),
    ).toHaveLength(3);
    expect(
      container.querySelectorAll('[data-ion-particle="potassium"]'),
    ).toHaveLength(0);
  });

  it("renders three outward potassium particles through each resting membrane surface", () => {
    render(
      <ActionPotentialScene
        mode="resting"
        frame={getActionPotentialFrame("resting", 0.2)}
        playing
      />,
    );

    const streams = screen.getAllByLabelText(/K⁺经[上下]膜向膜外流出/);
    expect(streams).toHaveLength(2);
    for (const stream of streams) {
      expect(stream).toHaveAttribute("data-ion-direction", "outward");
      expect(
        stream.querySelectorAll('[data-ion-particle="potassium"]'),
      ).toHaveLength(3);
    }
  });

  it.each([
    [1, "1", [["3", "2"], ["3", "4"]]],
    [3, "2", [["2", "1"], ["4", "5"]]],
    [5, "3", [["1", "0"], ["5", "6"]]],
  ] as const)(
    "renders four adjacent short arcs for conduction round %s",
    (macroStep, step, pairs) => {
      const { container } = render(
        <ActionPotentialScene
          mode="conduction"
          frame={getConductionStepFrame(macroStep, 0)}
          playing
        />,
      );

      const system = screen.getByLabelText("局部电流方向");
      expect(system).toHaveAttribute("data-current-step", step);
      const inside = Array.from(
        system.querySelectorAll('[data-current-layer="inside"]'),
      );
      const outside = Array.from(
        system.querySelectorAll('[data-current-layer="outside"]'),
      );
      expect(inside).toHaveLength(2);
      expect(outside).toHaveLength(2);
      expect(
        inside.every(
          (path) => path.getAttribute("data-current-direction") === "outward",
        ),
      ).toBe(true);
      expect(
        outside.every(
          (path) => path.getAttribute("data-current-direction") === "inward",
        ),
      ).toBe(true);
      expect(
        inside.map((path) => [
          path.getAttribute("data-source-segment"),
          path.getAttribute("data-target-segment"),
        ]),
      ).toEqual(pairs);
      expect(
        outside.map((path) => [
          path.getAttribute("data-target-segment"),
          path.getAttribute("data-source-segment"),
        ]),
      ).toEqual(pairs);
      for (const path of outside) {
        const pathData = path.getAttribute("d")!;
        const end = pathData.match(/([\d.]+)\s+22$/);
        expect(end, `missing outside path endpoint in ${pathData}`).not.toBeNull();
        const endX = Number(end![1]);
        const originCenter =
          50 + Number(path.getAttribute("data-source-segment")) * 100;
        const destinationCenter =
          50 + Number(path.getAttribute("data-target-segment")) * 100;

        expect(Math.abs(endX - destinationCenter)).toBeGreaterThanOrEqual(36);
        expect(Math.abs(endX - destinationCenter)).toBeLessThan(50);
        expect(endX).toBeGreaterThan(Math.min(originCenter, destinationCenter));
        expect(endX).toBeLessThan(Math.max(originCenter, destinationCenter));
      }
      expect(container.querySelectorAll("[data-current-arc]")).toHaveLength(4);
      for (const path of container.querySelectorAll("[data-current-arc]")) {
        expect(path).toHaveAttribute("pathLength", "1");
        expect(path).toHaveAttribute("data-current-drawing", "true");
        expect(path).not.toHaveAttribute("marker-end");
      }
    },
  );

  it("uses valid graphic and group roles with exact local-current descriptions", () => {
    const generationFrame = getActionPotentialFrame("generation", 0.55);
    const { rerender } = render(
      <ActionPotentialScene
        mode="generation"
        frame={generationFrame}
        playing={false}
      />,
    );

    expect(
      screen.getByRole("group", { name: "第4膜段外正内负" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("img", { name: "第4膜段上膜 Na⁺通道开放" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("img", { name: "第4膜段下膜 Na⁺通道开放" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("img", { name: "Na⁺经第4膜段上膜进入膜内" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("img", { name: "Na⁺经第4膜段下膜进入膜内" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("img", { name: "刺激点" })).toBeInTheDocument();

    rerender(
      <ActionPotentialScene
        mode="conduction"
        frame={getConductionStepFrame(1, 0)}
        playing={false}
      />,
    );
    const current = screen.getByRole("img", { name: "局部电流方向" });
    expect(current).toHaveAccessibleDescription(
      "膜内局部电流向两侧未兴奋区；膜外局部电流返回兴奋区",
    );
  });

  it("holds completed current arcs with arrowheads until the next click", () => {
    const { container } = render(
      <ActionPotentialScene
        mode="conduction"
        frame={getConductionStepFrame(1, 1)}
        playing={false}
      />,
    );

    for (const path of container.querySelectorAll("[data-current-arc]")) {
      expect(path).toHaveAttribute("data-current-drawing", "false");
      expect(path.getAttribute("marker-end")).toMatch(
        /^url\(#ap-current-arrow-(inside|outside)\)$/,
      );
    }
  });

  it("turns automatic phase announcements off and restores polite announcements when paused", () => {
    const frame = getActionPotentialFrame("generation", 0.55);
    const { rerender } = render(
      <ActionPotentialScene mode="generation" frame={frame} playing />,
    );

    expect(screen.getByText(frame.instruction)).toHaveAttribute(
      "aria-live",
      "off",
    );
    rerender(
      <ActionPotentialScene
        mode="generation"
        frame={frame}
        playing={false}
      />,
    );
    expect(screen.getByText(frame.instruction)).toHaveAttribute(
      "aria-live",
      "polite",
    );
  });

  it.each([
    [2, 0.5],
    [2, 1],
    [4, 0.5],
    [4, 1],
    [6, 0.5],
    [6, 1150 / 1400],
    [6, 1],
  ] as const)(
    "hides current arcs outside local-current at step %s progress %s",
    (step, progress) => {
      const { container } = render(
        <ActionPotentialScene
          mode="conduction"
          frame={getConductionStepFrame(step, progress)}
          playing
        />,
      );
      expect(container.querySelectorAll("[data-current-arc]")).toHaveLength(0);
    },
  );

  it("reserves separate vertical lanes for current and region labels", () => {
    const stylesheet = readFileSync(
      "components/action-potential/action-potential.css",
      "utf8",
    );

    expect(stylesheet).toMatch(
      /\.ap-fiber-stage\s*\{[^}]*min-height:\s*400px;/s,
    );
    expect(stylesheet).toMatch(
      /\.ap-region-labels\s*\{[^}]*top:\s*auto;[^}]*bottom:\s*32px;/s,
    );
    expect(stylesheet).toMatch(
      /@media\s*\(max-width:\s*720px\)[\s\S]*\.ap-fiber-stage\s*\{[^}]*min-height:\s*400px;/s,
    );
  });

  it("shows only the active phase caption before conduction completes", () => {
    const firstFrame = getConductionStepFrame(1, 0);
    const { container, rerender } = render(
      <ActionPotentialScene mode="conduction" frame={firstFrame} playing />,
    );

    expect(screen.getByText("形成局部电流")).toBeInTheDocument();
    expect(
      screen.queryByText("兴奋由刺激点向两侧逐段传导"),
    ).not.toBeInTheDocument();
    expect(screen.queryByText("兴奋区移动")).not.toBeInTheDocument();
    expect(screen.queryByText("动作电位整体平移")).not.toBeInTheDocument();

    const nextFrame = getConductionStepFrame(2, 0.5);
    rerender(
      <ActionPotentialScene mode="conduction" frame={nextFrame} playing />,
    );
    expect(screen.getByText(nextFrame.instruction)).toBeInTheDocument();
    expect(screen.queryByText("形成局部电流")).not.toBeInTheDocument();
    expect(container.querySelector(".ap-bidirectional")).toBeNull();
  });

  it("shows the completed conduction state without unexcited regions", () => {
    const { container } = render(
      <ActionPotentialScene
        mode="conduction"
        frame={getConductionStepFrame(6, 1)}
        playing={false}
      />,
    );

    expect(
      container.querySelectorAll('[data-segment-polarity="excited"]'),
    ).toHaveLength(7);
    expect(screen.queryAllByText("未兴奋区")).toHaveLength(0);
    expect(screen.queryByText("全部膜段已兴奋")).not.toBeInTheDocument();
    expect(
      screen.getByText(
        "神经冲动以电信号（局部电流）的形式在神经纤维上双向传导。",
      ),
    ).toBeInTheDocument();
    expect(container.querySelectorAll("[data-current-arc]")).toHaveLength(0);
  });

  it("shows the new action-potential beat without ions or local-current paths", () => {
    const frame = getConductionStepFrame(2, 1);
    const { container } = render(
      <ActionPotentialScene mode="conduction" frame={frame} playing />,
    );

    expect(frame.phase).toBe("neighbor-excited");
    expect(screen.getByText("相邻部位形成动作电位")).toBeInTheDocument();
    expect(container.querySelectorAll('[data-segment-polarity="excited"]')).toHaveLength(3);
    expect(container.querySelectorAll('[data-ion-particle="sodium"]')).toHaveLength(0);
    expect(screen.queryByLabelText("局部电流方向")).not.toBeInTheDocument();
  });

  it("labels the third newly-excited beat as fully excited", () => {
    render(
      <ActionPotentialScene
        mode="conduction"
        frame={getConductionStepFrame(6, 1150 / 1400)}
        playing
      />,
    );

    expect(screen.queryByText("全部膜段已兴奋")).not.toBeInTheDocument();
    expect(screen.queryAllByText("未兴奋区")).toHaveLength(0);
  });

  it("renders the exact generation knowledge facts without recovery", () => {
    render(
      <ActionPotentialKnowledgeCard content={ACTION_POTENTIAL_MODES[1]} />,
    );
    const card = screen.getByLabelText("当前模式知识卡");
    expect(card).toHaveTextContent("Na⁺通道开放");
    expect(card).toHaveTextContent("Na⁺内流");
    expect(card).toHaveTextContent("受刺激部位膜外为负、膜内为正");
    expect(card).not.toHaveTextContent(/中央|外负内正/);
    expect(card).not.toHaveTextContent(/K⁺|恢复/);
    expect(screen.getAllByRole("term")).toHaveLength(3);
  });
});
