"use client";

import { useSyncExternalStore } from "react";

export const CONSENT_KEY = "riversmag-consent";
const LEGACY_CONSENT_KEY = "roamora-consent";

export type ConsentChoice = "accepted" | "essential";
export type ConsentState = ConsentChoice | "unknown";

const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((listener) => listener());
}

export function subscribeConsent(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getConsentState(): ConsentState {
  try {
    const value = window.localStorage.getItem(CONSENT_KEY);
    if (value === "accepted" || value === "essential") return value;

    const legacyValue = window.localStorage.getItem(LEGACY_CONSENT_KEY);
    if (legacyValue === "accepted" || legacyValue === "essential") {
      window.localStorage.setItem(CONSENT_KEY, legacyValue);
      window.localStorage.removeItem(LEGACY_CONSENT_KEY);
      return legacyValue;
    }

    return "unknown";
  } catch {
    return "unknown";
  }
}

export function setConsent(choice: ConsentChoice) {
  try {
    window.localStorage.setItem(CONSENT_KEY, choice);
  } catch {
    // localStorage unavailable (private mode, etc.) — treat as no consent stored
  }
  notify();
}

const getServerSnapshot = (): ConsentState => "unknown";

export function useConsent(): ConsentState {
  return useSyncExternalStore(subscribeConsent, getConsentState, getServerSnapshot);
}
