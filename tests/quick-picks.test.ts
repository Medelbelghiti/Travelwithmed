import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { priceLevel, selectQuickPicks, type PickCandidate } from "../src/lib/quick-picks";

const c = (id: string, rating: number | null, priceRange: string | null, link = true): PickCandidate => ({
  id,
  name: id,
  href: `/hotels/${id}`,
  rating,
  priceRange,
  affiliateLinkId: link ? `l-${id}` : null,
});

const labels = { best: "Best overall", value: "Best value", premium: "Best for a splurge" };

describe("priceLevel", () => {
  it("reads tiers and amounts", () => {
    assert.equal(priceLevel("$$"), 2);
    assert.equal(priceLevel("$89"), 89);
    assert.equal(priceLevel(null), Number.POSITIVE_INFINITY);
  });
});

describe("selectQuickPicks", () => {
  it("picks best rated, cheapest of the rest, then most upscale, without repeats", () => {
    const picks = selectQuickPicks([c("a", 9.4, "$$$"), c("b", 8.8, "$$"), c("c", 9.0, "$$$$"), c("d", 8.0, "$$")], labels);
    assert.deepEqual(
      picks.map((p) => [p.label, p.id]),
      [["Best overall", "a"], ["Best value", "b"], ["Best for a splurge", "c"]],
    );
  });

  it("ignores options that cannot be booked", () => {
    const picks = selectQuickPicks([c("a", 9.9, "$", false), c("b", 8, "$$"), c("c", 7, "$$$")], labels);
    assert.ok(picks.every((p) => p.id !== "a"));
  });

  it("returns nothing when there is no real choice", () => {
    assert.deepEqual(selectQuickPicks([c("a", 9, "$$")], labels), []);
  });
});
