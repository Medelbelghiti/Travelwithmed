import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { buildClickReport, parsePeriod, placementLabel, referrerPath, dailySeries } from "../src/lib/click-report";

describe("click report", () => {
  it("parses the period, defaulting to 30 days", () => {
    assert.equal(parsePeriod("7"), 7);
    assert.equal(parsePeriod("90"), 90);
    assert.equal(parsePeriod("365"), 30);
    assert.equal(parsePeriod(undefined), 30);
  });

  it("labels placements", () => {
    assert.equal(placementLabel("cmthy4m85001cdsvj2ujrbg0j"), "in-article button");
    assert.equal(placementLabel("hotel-Le Meurice"), "hotel card");
    assert.equal(placementLabel("home-deals"), "home-deals");
    assert.equal(placementLabel(null), "unspecified");
  });

  it("reduces referrers to site paths", () => {
    assert.equal(referrerPath("https://riversmag.com/articles/paris-esim?x=1", "riversmag.com"), "/articles/paris-esim");
    assert.equal(referrerPath("https://www.riversmag.com/", "riversmag.com"), "/");
    assert.equal(referrerPath("https://google.com/search", "riversmag.com"), "external");
    assert.equal(referrerPath(null, "riversmag.com"), "direct / unknown");
  });

  it("aggregates categories across links (one row per category, not per link)", () => {
    const links = new Map([
      ["a", { partnerName: "Airalo", category: "ESIM" }],
      ["b", { partnerName: "Holafly", category: "ESIM" }],
      ["c", { partnerName: "Booking.com", category: "HOTELS" }],
    ]);
    const now = new Date("2026-11-09T12:00:00Z");
    const at = new Date("2026-11-08T10:00:00Z");
    const rows = ["a", "a", "b", "c"].map((id) => ({ createdAt: at, referrer: null, placement: null, affiliateLinkId: id }));
    const report = buildClickReport(rows, links, "riversmag.com", 7, now);
    assert.equal(report.total, 4);
    assert.deepEqual(report.byCategory.map((r) => [r.key, r.count]), [["esim", 3], ["hotels", 1]]);
    assert.equal(report.byPartner[0].key, "Airalo");
    assert.equal(report.daily.length, 7);
    assert.equal(report.daily.find((d) => d.day === "2026-11-08")?.count, 4);
  });

  it("zero-fills the daily series", () => {
    const series = dailySeries([], 3, new Date("2026-11-09T12:00:00Z"));
    assert.deepEqual(series.map((d) => d.day), ["2026-11-07", "2026-11-08", "2026-11-09"]);
  });
});
