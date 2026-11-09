import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { pickCategoryLink, type FallbackLink } from "../src/lib/affiliate-fallback";

const f = (id: string, category: string, destinationId: string | null, targetUrl = "https://x.com/"): FallbackLink => ({ id, category, destinationId, targetUrl, priority: 0 });

describe("pickCategoryLink", () => {
  const fallback = [
    f("japan-esim", "ESIM", "japan"),
    f("global-esim", "ESIM", null),
    f("gyg-canada", "ACTIVITIES", null, "https://www.getyourguide.com/s/?partner_id=X&q=Canada"),
    f("cars", "CAR_RENTAL", null),
  ];
  it("prefers the destination's own link", () => {
    assert.equal(pickCategoryLink("ESIM", [{ id: "kyoto-esim", category: "ESIM" }], ["japan"], fallback)?.id, "kyoto-esim");
  });
  it("falls back to the nearest ancestor before site-wide links", () => {
    assert.equal(pickCategoryLink("ESIM", [], ["japan", "asia"], fallback)?.id, "japan-esim");
  });
  it("uses generic site-wide links but never a place-specific one", () => {
    assert.equal(pickCategoryLink("CAR_RENTAL", [], [], fallback)?.id, "cars");
    assert.equal(pickCategoryLink("ACTIVITIES", [], [], fallback), undefined);
  });
});
