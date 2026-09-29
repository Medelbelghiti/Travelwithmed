import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { buildMetaTitle, hotelSchema, META_TITLE_MAX } from "../src/lib/seo";

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

describe("buildMetaTitle", () => {
  it("keeps a short title that already names the destination and adds the brand", () => {
    assert.equal(
      buildMetaTitle("eSIM in Rome: Stay Connected", "Rome"),
      "eSIM in Rome: Stay Connected | Riversmag",
    );
  });

  it("does not repeat the destination when the title already contains it", () => {
    const t = buildMetaTitle(
      "eSIM in Rio de Janeiro: Stay Connected Without Roaming",
      "Rio de Janeiro",
    );
    assert.ok(t.includes("Rio de Janeiro"));
    assert.equal(t.split("Rio de Janeiro").length - 1, 1);
  });

  it("adds the destination when the title does not name it", () => {
    assert.equal(
      buildMetaTitle("Three days in the Cyclades", "Naxos"),
      "Three days in the Cyclades — Naxos | Riversmag",
    );
  });

  it("never exceeds META_TITLE_MAX", () => {
    const cases: [string, string | null][] = [
      ["eSIM in Rio de Janeiro: Stay Connected Without Roaming", "Rio de Janeiro"],
      ["eSIM in Los Angeles: Stay Connected Without Roaming", "Los Angeles"],
      ["eSIM in Marrakech: Stay Connected Without Roaming", "Marrakech"],
      ["eSIM in New York: Stay Connected Without Roaming", "New York"],
      ["A Very Long Article Headline About Many Different Things In One Destination", null],
      ["Paris", "Paris"],
    ];
    for (const [title, dest] of cases) {
      const t = buildMetaTitle(title, dest);
      assert.ok(t.length <= META_TITLE_MAX, `too long (${t.length}): ${t}`);
    }
  });

  it("does not emit an ellipsis", () => {
    const t = buildMetaTitle(
      "A Very Long Article Headline About Many Different Things In One Destination",
      null,
    );
    assert.ok(!t.includes("..."));
  });

  it("keeps whole words when clamping, dropping the oversized one entirely", () => {
    const words = [
      "Supercalifragilistic",
      "expialidocious",
      "antidisestablishmentarianism",
      "pneumonoultramicroscopic",
    ];
    const t = buildMetaTitle(words.join(" "), null);
    assert.ok(t.length <= META_TITLE_MAX, `too long: ${t}`);
    assert.ok(t.endsWith("| Riversmag"));
    // Every emitted word must be a complete input word, never a cut fragment.
    for (const w of t.replace(" | Riversmag", "").split(" ")) {
      assert.ok(words.includes(w), `fragment emitted: ${w}`);
    }
    // The words that do not fit are dropped whole rather than truncated.
    assert.ok(!t.includes("antidisestablishmentarian"));
  });

  it("falls back to a destination guide title when there is no article title", () => {
    assert.equal(buildMetaTitle(null, "Lisbon"), "Lisbon Travel Guide | Riversmag");
    assert.equal(buildMetaTitle("", null), "Travel Guide | Riversmag");
  });

  it("collapses stray whitespace", () => {
    assert.equal(
      buildMetaTitle("  Spaced   out  title  ", "Rome"),
      "Spaced out title — Rome | Riversmag",
    );
  });
});
