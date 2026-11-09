import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { encodeDates, decodeDates } from "../src/lib/cache";

describe("cache date codec", () => {
  it("round-trips Dates through JSON, as unstable_cache does", () => {
    const row = {
      title: "Paris",
      publishedAt: new Date("2026-09-03T17:47:32.936Z"),
      updatedAt: null,
      author: { name: "Maya", createdAt: new Date("2026-01-01T00:00:00.000Z") },
      faqItems: [{ q: "a", at: new Date("2026-02-02T00:00:00.000Z") }],
      count: 3,
    };
    const restored = decodeDates(JSON.parse(JSON.stringify(encodeDates(row)))) as typeof row;
    assert.ok(restored.publishedAt instanceof Date);
    assert.equal(restored.publishedAt.toISOString(), "2026-09-03T17:47:32.936Z");
    assert.ok(restored.author.createdAt instanceof Date);
    assert.ok(restored.faqItems[0].at instanceof Date);
    assert.equal(restored.updatedAt, null);
    assert.equal(restored.count, 3);
    assert.deepEqual(decodeDates(encodeDates(null)), null);
  });

  it("does not turn ordinary objects into Dates", () => {
    const value = { __date: "x", other: 1 };
    assert.deepEqual(decodeDates(value), value);
  });
});
