import { useCallback, useEffect, useRef, useState } from "react";
import { call, useTauriEvent } from "../../shared/tauri";
import { clamp } from "../../shared/format";

/**
 * Volume master + mute. `levelRef` (peak 0..1) disimpan di ref — BUKAN state — agar event 20 Hz
 * tidak memicu render React; visualizer membacanya langsung lewat rAF.
 */
export function useAudio(visible) {
  const [s, setS] = useState({ volume: 0.5, muted: false });
  const sRef = useRef(s);
  sRef.current = s;
  const levelRef = useRef(0);
  const timer = useRef(0);
  const last = useRef(0);

  useTauriEvent("audio-level", (v) => (levelRef.current = v));

  const refresh = useCallback(async () => {
    const r = await call("audio_get");
    if (r) setS(r);
    return r;
  }, []);

  useEffect(() => {
    if (visible) refresh();
  }, [visible, refresh]);
  useEffect(() => () => clearTimeout(timer.current), []);

  const setVolume = useCallback((v) => {
    v = clamp(v, 0, 1);
    setS((p) => ({ ...p, volume: v, muted: v > 0 ? false : p.muted }));
    clearTimeout(timer.current);
    const wait = Math.max(0, 45 - (performance.now() - last.current));
    timer.current = setTimeout(() => {
      last.current = performance.now();
      call("audio_set_volume", { volume: v });
    }, wait);
  }, []);

  const nudge = useCallback((d) => setVolume(sRef.current.volume + d), [setVolume]);

  const toggleMute = useCallback(() => {
    const muted = !sRef.current.muted;
    setS((p) => ({ ...p, muted }));
    call("audio_set_mute", { muted });
  }, []);

  const meter = useCallback((on) => {
    if (!on) levelRef.current = 0;
    call("audio_meter", { on });
  }, []);

  return { ...s, setVolume, nudge, toggleMute, refresh, meter, levelRef };
}
