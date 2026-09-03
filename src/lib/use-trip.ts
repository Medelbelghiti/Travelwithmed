"use client";

import { useCallback, useSyncExternalStore } from "react";

export interface TripItem {
  id: string;
  name: string;
  slug: string;
  image: string | null;
  priceRange: string | null;
  duration: string | null;
  rating: number | null;
  category: string | null;
  destinationName: string | null;
}

const STORAGE_KEY = "riversmag-trip";
const CHANGE_EVENT = "riversmag-trip-change";

function readStorage(): TripItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function subscribe(callback: () => void) {
  window.addEventListener(CHANGE_EVENT, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(CHANGE_EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}

function getSnapshot(): TripItem[] {
  return readStorage();
}

function getServerSnapshot(): TripItem[] {
  return [];
}

function writeStorage(next: TripItem[]) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* ignore quota errors */
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

/** Returns trip items plus helpers. Hydrates safely for SSR via useSyncExternalStore. */
export function useTrip() {
  const items = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const count = items.length;

  const inTrip = useCallback((id: string) => (getSnapshot() ?? []).some((i) => i.id === id), []);
  const toggle = useCallback((item: TripItem) => {
    const prev = getSnapshot();
    const exists = prev.some((i) => i.id === item.id);
    const next = exists ? prev.filter((i) => i.id !== item.id) : [...prev, item];
    writeStorage(next);
  }, []);
  const remove = useCallback((id: string) => {
    const next = getSnapshot().filter((i) => i.id !== id);
    writeStorage(next);
  }, []);
  const clear = useCallback(() => {
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
    window.dispatchEvent(new Event(CHANGE_EVENT));
  }, []);

  // On first client render, whether we've hydrated from storage yet.
  const hasHydrated = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
  const ready = hasHydrated;

  return { items, inTrip, toggle, remove, clear, count, ready };
}
