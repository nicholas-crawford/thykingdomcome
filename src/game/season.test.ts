import { describe, expect, test } from "vite-plus/test";
import { getFarmYield, getProbability, getSeason } from "./season";

const SEASONS = ["Spring", "Summer", "Autumn", "Winter"];

describe("getSeason", () => {
  // The 90-day season length is the rule itself, so these are literal.
  test.each([
    [0, "Spring"],
    [89, "Spring"],
    [90, "Summer"],
    [179, "Summer"],
    [180, "Autumn"],
    [269, "Autumn"],
    [270, "Winter"],
    [359, "Winter"],
    [360, "Spring"],
    [450, "Summer"],
    [719, "Winter"],
  ])("day %i is %s", (day, season) => {
    expect(getSeason(day)).toBe(season);
  });
});

describe("getProbability", () => {
  // Balance numbers get tuned often, so assert what must always hold
  // rather than pinning the current values.
  test.each(SEASONS)("%s probabilities sum to 1", (season) => {
    const total = Object.values(getProbability(season)).reduce(
      (sum, p) => sum + p,
      0,
    );
    expect(total).toBeCloseTo(1, 10);
  });

  test.each(SEASONS)("%s probabilities are each within [0, 1]", (season) => {
    for (const p of Object.values(getProbability(season))) {
      expect(p).toBeGreaterThanOrEqual(0);
      expect(p).toBeLessThanOrEqual(1);
    }
  });

  test.each(SEASONS)("%s only yields whole, non-negative amounts", (season) => {
    for (const amount of Object.keys(getProbability(season))) {
      expect(Number.isInteger(Number(amount))).toBe(true);
      expect(Number(amount)).toBeGreaterThanOrEqual(0);
    }
  });

  test("winter is the likeliest season to find nothing", () => {
    // A missing 0 key means there is no chance of finding nothing.
    const chanceOfNothing = (season: string) => getProbability(season)[0] ?? 0;

    for (const season of SEASONS.filter((s) => s !== "Winter")) {
      expect(chanceOfNothing("Winter")).toBeGreaterThan(
        chanceOfNothing(season),
      );
    }
  });
});

describe("getFarmYield", () => {
  test("every season yields something", () => {
    for (const season of SEASONS) {
      expect(getFarmYield(season)).toBeGreaterThan(0);
    }
  });

  test("summer yields more than spring, winter less", () => {
    expect(getFarmYield("Summer")).toBeGreaterThan(getFarmYield("Spring"));
    expect(getFarmYield("Winter")).toBeLessThan(getFarmYield("Spring"));
  });

  test("spring and autumn yield the same", () => {
    expect(getFarmYield("Spring")).toBe(getFarmYield("Autumn"));
  });
});
