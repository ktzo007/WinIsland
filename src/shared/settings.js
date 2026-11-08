import { useSyncExternalStore } from "react";

const KEY = "di.settings.v2";

export const DEFAULTS = {
  general: {
    monitor: 0,
    perf: "balanced", // "eco" | "balanced" | "ultra"
    hoverDelay: 110,
    hideInFullscreen: true,
    hotkeys: true,
    launchAtLogin: false,
  },
  island: {
    tabs: ["media", "system", "calendar", "clipboard", "shelf", "focus", "controls"],
    accent: "auto", // "auto" (warna dari sampul) atau hex
    showClock: true,
    clock24: true,
    ambient: true,
    wheelVolume: true,
    toastTrack: true,
    toastPower: true,
    toastPrivacy: true,
    toastClipboard: false,
  },
  widgets: { weatherOn: false, weatherCity: "", weatherUnit: "c", focusMin: 25, breakMin: 5, firstDay: 1 },
  clipboard: { enabled: true, max: 25 },
  dock: { enabled: false, autohide: false, size: 46, magnify: 1.6, showRunning: true, hideTaskbar: false, pinned: [] },
  shortcuts: [],
};

function merge(base, patch) {
  if (Array.isArray(base) || typeof base !== "object" || base === null) return patch ?? base;
  const out = { ...base };
  for (const k of Object.keys(patch || {})) {
    out[k] = k in base && !Array.isArray(base[k]) && typeof base[k] === "object" && base[k] !== null ? merge(base[k], patch[k]) : patch[k];
  }
  return out;
}

function load() {
  try {
    return merge(DEFAULTS, JSON.parse(localStorage.getItem(KEY) || "{}"));
  } catch {
    return merge(DEFAULTS, {});
  }
}

let cache = load();
const subs = new Set();
const notify = () => subs.forEach((f) => f());

export const getSettings = () => cache;

/** Gabungkan patch (objek bersarang digabung, array diganti) lalu simpan & siarkan. */
export function updateSettings(patch) {
  cache = merge(cache, patch);
  try {
    localStorage.setItem(KEY, JSON.stringify(cache));
  } catch {}
  notify();
}

export function resetSettings() {
  cache = merge(DEFAULTS, {});
  try {
    localStorage.setItem(KEY, JSON.stringify(cache));
  } catch {}
  notify();
}

// Jendela lain (Pengaturan ↔ Island ↔ Dock) berbagi localStorage → sinkron lewat event 'storage'.
window.addEventListener("storage", (e) => {
  if (e.key === KEY) {
    cache = load();
    notify();
  }
});

const subscribe = (f) => {
  subs.add(f);
  return () => subs.delete(f);
};

export const useSettings = () => useSyncExternalStore(subscribe, getSettings);
