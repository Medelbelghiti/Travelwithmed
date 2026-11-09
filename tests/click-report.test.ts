import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { buildClickReport, parsePeriod, placementLabel, referrerPath, dailySeries } from "../src/lib/click-report";

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36";

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
    const rows = ["a", "a", "b", "c"].map((id) => ({ createdAt: at, referrer: null, placement: null, affiliateLinkId: id, userAgent: UA }));
    rows.push({ createdAt: at, referrer: null, placement: null, affiliateLinkId: "a", userAgent: "Googlebot/2.1" });
    const report = buildClickReport(rows, links, "riversmag.com", 7, now);
    assert.equal(report.total, 4);
    assert.equal(report.botClicks, 1);
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

import { isBotUserAgent } from "../src/lib/click-report";

describe("bot filtering", () => {
  it("flags crawlers, tools and empty user agents", () => {
    assert.equal(isBotUserAgent("Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)"), true);
    assert.equal(isBotUserAgent("python-requests/2.31.0"), true);
    assert.equal(isBotUserAgent("Mozilla/5.0 (X11; Linux x86_64) HeadlessChrome/120.0"), true);
    assert.equal(isBotUserAgent(null), true);
    assert.equal(isBotUserAgent(""), true);
  });
  it("keeps real browsers", () => {
    assert.equal(isBotUserAgent("Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1"), false);
    assert.equal(isBotUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36"), false);
  });
});
