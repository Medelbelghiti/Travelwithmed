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

// Cached snapshot so useSyncExternalStore sees a stable reference between
// change events. A fresh array on every call would trigger an infinite
// re-render loop ("Maximum update depth exceeded") and unmount the app.
let cachedSnapshot: TripItem[] = [];

function readStorage(): TripItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as TripItem[]) : [];
  } catch {
    return [];
  }
}

function refreshSnapshot(): TripItem[] {
  cachedSnapshot = readStorage();
  return cachedSnapshot;
}

function subscribe(callback: () => void) {
  refreshSnapshot();
  window.addEventListener(CHANGE_EVENT, callback);
  window.addEventListener("storage", callback);
  return () => {
    window.removeEventListener(CHANGE_EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}

// Stable cached snapshot: returns the same array reference until the cache is
// refreshed by the change/storage events above.
function getSnapshot(): TripItem[] {
  return cachedSnapshot;
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
  refreshSnapshot();
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

/** Returns trip items plus helpers. Hydrates safely for SSR via useSyncExternalStore. */
export function useTrip() {
  const items = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const inTrip = useCallback((id: string) => cachedSnapshot.some((i) => i.id === id), []);
  const toggle = useCallback((item: TripItem) => {
    const prev = cachedSnapshot;
    const exists = prev.some((i) => i.id === item.id);
    const next = exists ? prev.filter((i) => i.id !== item.id) : [...prev, item];
    writeStorage(next);
  }, []);
  const remove = useCallback((id: string) => {
    const next = cachedSnapshot.filter((i) => i.id !== id);
    writeStorage(next);
  }, []);
  const clear = useCallback(() => {
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
    refreshSnapshot();
    window.dispatchEvent(new Event(CHANGE_EVENT));
  }, []);

  const count = items.length;

  return { items, inTrip, toggle, remove, clear, count, ready: true };
}
