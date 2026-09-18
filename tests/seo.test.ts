import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { hotelSchema } from "../src/lib/seo";

describe("hotelSchema", () => {
  it("omits aggregateRating when reviewCount is null", () => {
    const schema = hotelSchema({
      name: "Test Hotel",
      rating: 4.5,
      reviewCount: null,
    });
    assert.equal(schema.aggregateRating, undefined);
  });

  it("omits aggregateRating when rating is null", () => {
    const schema = hotelSchema({
      name: "Test Hotel",
      rating: null,
      reviewCount: 10,
    });
    assert.equal(schema.aggregateRating, undefined);
  });

  it("omits aggregateRating when both are null/undefined", () => {
    const schema = hotelSchema({ name: "Test Hotel" });
    assert.equal(schema.aggregateRating, undefined);
  });

  it("includes aggregateRating only when both rating and reviewCount are valid", () => {
    const schema = hotelSchema({
      name: "Test Hotel",
      rating: 4.5,
      reviewCount: 42,
    });
    assert.deepEqual(schema.aggregateRating, {
      "@type": "AggregateRating",
      ratingValue: 4.5,
      bestRating: 5,
      reviewCount: 42,
    });
  });

  it("omits aggregateRating when reviewCount is 0", () => {
    const schema = hotelSchema({
      name: "Test Hotel",
      rating: 4.0,
      reviewCount: 0,
    });
    assert.equal(schema.aggregateRating, undefined);
  });

  it("omits aggregateRating when rating exceeds bestRating", () => {
    const schema = hotelSchema({
      name: "Test Hotel",
      rating: 6,
      reviewCount: 10,
    });
    assert.equal(schema.aggregateRating, undefined);
  });

  it("uses correct schema type", () => {
    const schema = hotelSchema({ name: "My Hotel" });
    assert.equal(schema["@type"], "Hotel");
    assert.equal(schema.name, "My Hotel");
  });

  it("does not fabricate reviewCount:1 when only rating is provided", () => {
    const schema = hotelSchema({
      name: "Hotel",
      rating: 4.0,
    });
    // reviewCount is undefined, so aggregateRating must be absent
    assert.equal(schema.aggregateRating, undefined);
  });
});
