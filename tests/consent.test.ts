import { describe, it, beforeEach } from "node:test";
import assert from "node:assert/strict";

function installWindowStub(initial: Record<string, string> = {}) {
  const store = new Map<string, string>(Object.entries(initial));
  (globalThis as unknown as { window: unknown }).window = {
    localStorage: {
      getItem: (k: string) => (store.has(k) ? store.get(k)! : null),
      setItem: (k: string, v: string) => void store.set(k, v),
      removeItem: (k: string) => void store.delete(k),
    },
  };
  return store;
}

// eslint-disable-next-line @typescript-eslint/no-require-imports
const consent = require("../src/lib/consent") as typeof import("../src/lib/consent");

describe("consent storage", () => {
  beforeEach(() => {
    installWindowStub();
  });

  it("returns unknown when nothing is stored", () => {
    installWindowStub();
    assert.equal(consent.getConsentState(), "unknown");
  });

  it("persists an explicit choice under the Riversmag key", () => {
    const store = installWindowStub();
    consent.setConsent("accepted");
    assert.equal(store.get("riversmag-consent"), "accepted");
    assert.equal(consent.getConsentState(), "accepted");
  });

  it("migrates the legacy roamora-consent key without losing the choice", () => {
    const store = installWindowStub({ "roamora-consent": "essential" });
    assert.equal(consent.getConsentState(), "essential");
    assert.equal(store.get("riversmag-consent"), "essential");
    assert.equal(store.has("roamora-consent"), false);
  });

  it("ignores invalid stored values", () => {
    installWindowStub({ "riversmag-consent": "yes-please" });
    assert.equal(consent.getConsentState(), "unknown");
  });

  it("treats unavailable localStorage as unknown (no crash)", () => {
    (globalThis as unknown as { window: unknown }).window = {
      localStorage: {
        getItem: () => {
          throw new Error("denied");
        },
        setItem: () => {
          throw new Error("denied");
        },
        removeItem: () => {
          throw new Error("denied");
        },
      },
    };
    assert.equal(consent.getConsentState(), "unknown");
  });
});
