import { useCallback, useEffect, useRef, useState } from "react";
import { dayKey } from "../../shared/format";

const KEY = "di.agenda.v1";
const load = () => {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]");
  } catch {
    return [];
  }
};

/** Agenda lokal (disimpan di localStorage). Pengingat dijadwalkan dengan SATU setTimeout ke acara berikutnya. */
export function useAgenda(live, onDue) {
  const [events, setEvents] = useState(load);
  const [bump, setBump] = useState(0);
  const due = useRef(onDue);
  due.current = onDue;

  const persist = (next) => {
    setEvents(next);
    try {
      localStorage.setItem(KEY, JSON.stringify(next));
    } catch {}
  };

  const add = useCallback((date, time, text) => {
    setEvents((p) => {
      const next = [...p, { id: Date.now().toString(36), date, time, text }];
      try {
        localStorage.setItem(KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
  }, []);
  const remove = useCallback((id) => {
    setEvents((p) => {
      const next = p.filter((e) => e.id !== id);
      try {
        localStorage.setItem(KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
  }, []);

  useEffect(() => {
    if (!live) return;
    const now = Date.now();
    const today = dayKey(new Date());
    let next = null;
    for (const e of events) {
      if (e.date !== today || !e.time) continue;
      const [h, m] = e.time.split(":").map(Number);
      const t = new Date().setHours(h, m, 0, 0);
      if (t > now && (!next || t < next.t)) next = { t, e };
    }
    if (!next) return;
    const id = setTimeout(() => {
      due.current?.(next.e);
      setBump((b) => b + 1);
    }, Math.min(next.t - now, 2 ** 31 - 1));
    return () => clearTimeout(id);
  }, [events, live, bump]);

  const forDay = useCallback((key) => events.filter((e) => e.date === key).sort((a, b) => (a.time || "").localeCompare(b.time || "")), [events]);
  const hasDay = useCallback((key) => events.some((e) => e.date === key), [events]);
  return { events, add, remove, forDay, hasDay, persist };
}
