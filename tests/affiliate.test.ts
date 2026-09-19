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
