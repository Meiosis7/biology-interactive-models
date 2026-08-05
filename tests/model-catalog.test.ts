import { describe, expect, it } from "vitest";
import { MODEL_CATALOG, getAdjacentModels } from "../models/catalog";

describe("model catalog", () => {
  it("lists six unique models in teaching order", () => {
    expect(MODEL_CATALOG.map((item) => item.slug)).toEqual([
      "action-potential",
      "synapse-transmission",
      "membrane-potential-curve",
      "meter-deflection",
      "humoral-immunity",
      "cellular-immunity",
    ]);
    expect(new Set(MODEL_CATALOG.map((item) => item.href)).size).toBe(6);
  });

  it("returns cyclic previous and next entries", () => {
    const adjacent = getAdjacentModels("action-potential");

    expect(adjacent.previous.slug).toBe("cellular-immunity");
    expect(adjacent.next.slug).toBe("synapse-transmission");
  });

  it("gives every model the presentation data used by shared shells", () => {
    for (const item of MODEL_CATALOG) {
      expect(item.order).toBeGreaterThan(0);
      expect(item.title).not.toBe("");
      expect(item.shortLabel).not.toBe("");
      expect(item.description).not.toBe("");
      expect(item.keyPoints).toHaveLength(3);
      expect(item.themeColor).toMatch(/^#/);
    }
  });

  it("names an unknown model when adjacent navigation is requested", () => {
    expect(() => getAdjacentModels("unknown-model")).toThrow("unknown-model");
  });
});
