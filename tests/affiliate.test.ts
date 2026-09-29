import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { generateClickId, buildAffiliateUrl, resolveAffiliateTargetUrl } from "../src/lib/affiliate";

describe("generateClickId", () => {
  it("returns a valid UUID v4", () => {
    const id = generateClickId();
    assert.match(id, /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  });

  it("returns unique values on successive calls", () => {
    const a = generateClickId();
    const b = generateClickId();
    assert.notEqual(a, b);
  });
});

describe("buildAffiliateUrl", () => {
  it("appends UTM params and click_id to an absolute URL", () => {
    const url = buildAffiliateUrl(
      "https://example.com/hotel?existing=1",
      { utmSource: "riversmag", utmMedium: "affiliate", utmCampaign: "test" },
      "click-abc",
    );
    const parsed = new URL(url);
    assert.equal(parsed.searchParams.get("utm_source"), "riversmag");
    assert.equal(parsed.searchParams.get("utm_medium"), "affiliate");
    assert.equal(parsed.searchParams.get("utm_campaign"), "test");
    assert.equal(parsed.searchParams.get("existing"), "1");
  });

  it("produces the same URL with the same clickId (deterministic)", () => {
    const params = { utmSource: "riversmag", trackingParameter: "subid={click_id}" };
    const a = buildAffiliateUrl("https://example.com", params, "test-id-123");
    const b = buildAffiliateUrl("https://example.com", params, "test-id-123");
    assert.equal(a, b);
  });

  it("replaces {click_id} placeholder in trackingParameter template", () => {
    const url = buildAffiliateUrl(
      "https://example.com",
      { trackingParameter: "click_id={click_id}" },
      "uuid-123",
    );
    const parsed = new URL(url);
    assert.equal(parsed.searchParams.get("click_id"), "uuid-123");
  });

  it("uses bare trackingParameter name with clickId as value", () => {
    const url = buildAffiliateUrl(
      "https://example.com",
      { trackingParameter: "subid" },
      "uuid-456",
    );
    const parsed = new URL(url);
    assert.equal(parsed.searchParams.get("subid"), "uuid-456");
  });

  it("handles template with prefix before {click_id}", () => {
    const url = buildAffiliateUrl(
      "https://example.com",
      { trackingParameter: "ref=abc{click_id}" },
      "xyz",
    );
    const parsed = new URL(url);
    assert.equal(parsed.searchParams.get("ref"), "abcxyz");
  });

  it("normalizes legacy utm_source=roamora to riversmag", () => {
    const url = buildAffiliateUrl(
      "https://example.com",
      { utmSource: "roamora" },
      "test-id",
    );
    const parsed = new URL(url);
    assert.equal(parsed.searchParams.get("utm_source"), "riversmag");
  });

  it("defaults utm_source to riversmag when null", () => {
    const url = buildAffiliateUrl("https://example.com", { utmSource: null }, "id");
    const parsed = new URL(url);
    assert.equal(parsed.searchParams.get("utm_source"), "riversmag");
  });

  it("does not add tracking param when trackingParameter is null", () => {
    const url = buildAffiliateUrl("https://example.com", { trackingParameter: null }, "id");
    const parsed = new URL(url);
    assert.equal(parsed.searchParams.has("click_id"), false);
    assert.equal(parsed.searchParams.has("subid"), false);
  });

  // Phase 8.5 regression guards. The eSIM links were repointed from direct
  // Airalo referral URLs to Travelpayouts (tp.media) URLs. Two properties must
  // hold or revenue is silently lost.
  describe("Travelpayouts tp.media URLs", () => {
    const AIRALO_TP =
      "https://tp.media/r?campaign_id=541&marker=776824&p=8310&trs=573241&u=https%3A%2F%2Fairalo.com";

    it("never mutates the contractual marker/trs on a tp.media URL", () => {
      const url = buildAffiliateUrl(AIRALO_TP, { utmSource: "riversmag" }, "click-1");
      const parsed = new URL(url);
      assert.equal(parsed.searchParams.get("marker"), "776824");
      assert.equal(parsed.searchParams.get("trs"), "573241");
      assert.equal(parsed.searchParams.get("campaign_id"), "541");
      assert.equal(parsed.searchParams.get("p"), "8310");
      // get() decodes percent-encoding; toString() must keep it encoded.
      assert.equal(parsed.searchParams.get("u"), "https://airalo.com");
      assert.ok(url.includes("u=https%3A%2F%2Fairalo.com"), "u param must stay percent-encoded");
    });

    it("does not append UTM params to tp.media (owner committed to it verbatim)", () => {
      const url = buildAffiliateUrl(AIRALO_TP, { utmSource: "riversmag", utmCampaign: "esim" }, "click-1");
      const parsed = new URL(url);
      assert.equal(parsed.searchParams.has("utm_source"), false);
      assert.equal(parsed.searchParams.has("utm_medium"), false);
      assert.equal(parsed.searchParams.has("utm_campaign"), false);
      assert.equal(parsed.searchParams.has("utm_content"), false);
    });

    it("still records the per-click subid on tp.media so tracking survives", () => {
      const url = buildAffiliateUrl(
        AIRALO_TP,
        { trackingParameter: "subid={click_id}" },
        "click-xyz",
      );
      assert.equal(new URL(url).searchParams.get("subid"), "click-xyz");
    });

    it("still appends UTM params to non-Travelpayouts partners", () => {
      const url = buildAffiliateUrl(
        "https://www.booking.com/searchresults?ss=Rome",
        { utmSource: "riversmag" },
        "click-2",
      );
      const parsed = new URL(url);
      assert.equal(parsed.searchParams.get("utm_source"), "riversmag");
      assert.equal(parsed.searchParams.get("ss"), "Rome");
    });
  });

  it("preserves partner account identifiers such as associateid", () => {
    // associateid identifies the Riversmag account inside the partner's network.
    // It is contractual: rewriting it would break attribution until the partner
    // provisions a matching value, which loses revenue rather than fixing a
    // cosmetic brand inconsistency. Guarded here so it cannot be "cleaned up".
    const url = buildAffiliateUrl(
      "https://www.skyscanner.net/transport/flights/lhr/otp/?associateid=roamora&aid=associate",
      { utmSource: "riversmag" },
      "click-3",
    );
    const parsed = new URL(url);
    assert.equal(parsed.searchParams.get("associateid"), "roamora");
    assert.equal(parsed.searchParams.get("aid"), "associate");
  });
});

describe("trackAffiliateClick clickId persistence (regression guard)", () => {
  // The single canonical clickId generated per click must be stored on the
  // AffiliateClick row — otherwise the id in the redirect URL and the id in
  // the database diverge and attribution breaks. This guards against
  // regressions where the `clickId` field is dropped from the create payload
  // (the column has a `cuid()` default, so Prisma would silently succeed).
  it("passes the generated clickId into affiliateClick.create", () => {
    const source = readFileSync(join(__dirname, "..", "src", "lib", "affiliate.ts"), "utf8");
    const createBlock = source.slice(
      source.indexOf("prisma.affiliateClick.create("),
      source.indexOf("prisma.affiliateLink.update("),
    );
    assert.ok(createBlock.length > 0, "expected an affiliateClick.create call");
    assert.match(createBlock, /clickId,\s*\n?\s*url: redirectUrl/, "clickId must be persisted alongside the redirect URL");
  });

  it("generates the clickId exactly once per click", () => {
    const source = readFileSync(join(__dirname, "..", "src", "lib", "affiliate.ts"), "utf8");
    const fnBody = source.slice(source.indexOf("export async function trackAffiliateClick"));
    const generations = fnBody.match(/generateClickId\(\)/g) ?? [];
    assert.equal(generations.length, 1, "clickId must be generated exactly once per click");
  });
});

describe("resolveAffiliateTargetUrl", () => {
  it("returns absolute http URL", () => {
    const result = resolveAffiliateTargetUrl("https://example.com/path");
    assert.equal(result, "https://example.com/path");
  });

  it("returns absolute http URL", () => {
    const result = resolveAffiliateTargetUrl("http://example.com/path");
    assert.ok(result?.startsWith("http://example.com/path"));
  });

  it("rejects javascript: protocol", () => {
    const result = resolveAffiliateTargetUrl("javascript:alert(1)");
    assert.equal(result, null);
  });

  it("rejects data: protocol", () => {
    const result = resolveAffiliateTargetUrl("data:text/html,<h1>hi</h1>");
    assert.equal(result, null);
  });

  it("returns null for empty/null input", () => {
    assert.equal(resolveAffiliateTargetUrl(null), null);
    assert.equal(resolveAffiliateTargetUrl(undefined), null);
    assert.equal(resolveAffiliateTargetUrl(""), null);
  });

  it("resolves relative paths against site origin", () => {
    const result = resolveAffiliateTargetUrl("/deals");
    assert.ok(result?.includes("/deals"));
    assert.ok(result?.startsWith("https://"));
  });

  it("rejects ftp: protocol", () => {
    const result = resolveAffiliateTargetUrl("ftp://example.com/file");
    assert.equal(result, null);
  });
});
