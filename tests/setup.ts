import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";

afterEach(() => {
  cleanup();
});

export const canvasStyles: Array<[string, string | number]> = [];

export const canvasContext = {
  beginPath: vi.fn(),
  clearRect: vi.fn(),
  fillRect: vi.fn(),
  fillText: vi.fn(),
  lineTo: vi.fn(),
  moveTo: vi.fn(),
  scale: vi.fn(),
  setTransform: vi.fn(),
  stroke: vi.fn(),
  set font(value: string) {
    canvasStyles.push(["font", value]);
  },
  set fillStyle(value: string) {
    canvasStyles.push(["fillStyle", value]);
  },
  set lineWidth(value: number) {
    canvasStyles.push(["lineWidth", value]);
  },
  set strokeStyle(value: string) {
    canvasStyles.push(["strokeStyle", value]);
  },
};

export function resetCanvasContext() {
  canvasStyles.length = 0;
  Object.values(canvasContext).forEach((value) => {
    if (typeof value === "function" && "mockClear" in value) value.mockClear();
  });
}

Object.defineProperty(HTMLCanvasElement.prototype, "getContext", {
  value: vi.fn(() => canvasContext),
});
