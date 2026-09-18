import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { rateLimit } from "../src/lib/rate-limit";

describe("rateLimit", () => {
  it("allows requests within the limit", () => {
    const key = `test-rl-${Date.now()}-1`;
    assert.equal(rateLimit(key, 3, 60_000), true);
    assert.equal(rateLimit(key, 3, 60_000), true);
    assert.equal(rateLimit(key, 3, 60_000), true);
  });

  it("rejects requests over the limit", () => {
    const key = `test-rl-${Date.now()}-2`;
    rateLimit(key, 2, 60_000);
    rateLimit(key, 2, 60_000);
    assert.equal(rateLimit(key, 2, 60_000), false);
  });

  it("different keys are independent", () => {
    const base = Date.now();
    rateLimit(`key-a-${base}`, 1, 60_000);
    assert.equal(rateLimit(`key-b-${base}`, 1, 60_000), true);
  });
});
