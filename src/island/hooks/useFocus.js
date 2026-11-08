import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Pomodoro / Timer / Stopwatch berbasis timestamp (bukan hitungan tick) → tetap akurat walau UI
 * di-suspend saat Game Mode. Interval 1 dtk hanya hidup jika berjalan DAN kapsul terlihat.
 */
export function useFocus(live, focusMin, breakMin, onDone) {
  const dur = (phase) => (phase === "focus" ? focusMin : breakMin) * 60_000;
  const [s, setS] = useState({
    kind: "pomodoro", // "pomodoro" | "timer" | "stopwatch"
    phase: "focus",
    running: false,
    endAt: 0,
    startAt: 0,
    base: 0, // ms terakumulasi (stopwatch)
    total: focusMin * 60_000,
    left: focusMin * 60_000,
    elapsed: 0,
  });
  const done = useRef(onDone);
  done.current = onDone;

  // Durasi pengaturan berubah saat idle → ikut berubah.
  useEffect(() => {
    setS((p) => (p.running || p.kind !== "pomodoro" ? p : { ...p, total: dur(p.phase), left: dur(p.phase) }));
  }, [focusMin, breakMin]); // eslint-disable-line

  useEffect(() => {
    if (!s.running || !live) return;
    const tick = () => {
      const now = Date.now();
      if (s.kind === "stopwatch") {
        setS((p) => (p.running ? { ...p, elapsed: p.base + now - p.startAt } : p));
        return;
      }
      const left = s.endAt - now;
      if (left <= 0) {
        done.current?.(s.kind, s.phase);
        if (s.kind === "pomodoro") {
          const phase = s.phase === "focus" ? "break" : "focus";
          setS((p) => ({ ...p, phase, running: false, endAt: 0, total: dur(phase), left: dur(phase) }));
        } else {
          setS((p) => ({ ...p, running: false, endAt: 0, left: p.total }));
        }
      } else {
        setS((p) => (p.running ? { ...p, left } : p));
      }
    };
    tick();
    const id = setInterval(tick, s.kind === "stopwatch" ? 250 : 1000);
    return () => clearInterval(id);
  }, [s.running, s.endAt, s.kind, s.phase, live]); // eslint-disable-line

  const toggle = useCallback(
    () =>
      setS((p) => {
        const now = Date.now();
        if (p.kind === "stopwatch") {
          return p.running ? { ...p, running: false, base: p.elapsed } : { ...p, running: true, startAt: now };
        }
        return p.running
          ? { ...p, running: false, endAt: 0, left: Math.max(0, p.endAt - now) }
          : { ...p, running: true, endAt: now + p.left };
      }),
    []
  );

  const reset = useCallback(
    () =>
      setS((p) =>
        p.kind === "stopwatch"
          ? { ...p, running: false, base: 0, elapsed: 0 }
          : p.kind === "pomodoro"
          ? { ...p, phase: "focus", running: false, endAt: 0, total: focusMin * 60_000, left: focusMin * 60_000 }
          : { ...p, running: false, endAt: 0, left: p.total }
      ),
    [focusMin]
  );

  const setKind = useCallback(
    (kind) =>
      setS((p) => {
        const total = kind === "pomodoro" ? focusMin * 60_000 : kind === "timer" ? 10 * 60_000 : 0;
        return { ...p, kind, phase: "focus", running: false, endAt: 0, base: 0, elapsed: 0, total, left: total };
      }),
    [focusMin]
  );

  const setTimer = useCallback((min) => {
    const total = min * 60_000;
    setS((p) => ({ ...p, kind: "timer", phase: "focus", running: false, endAt: 0, total, left: total }));
  }, []);

  const progress = s.kind === "stopwatch" ? (s.elapsed % 60_000) / 60_000 : s.total ? 1 - s.left / s.total : 0;
  return { ...s, progress, toggle, reset, setKind, setTimer };
}
