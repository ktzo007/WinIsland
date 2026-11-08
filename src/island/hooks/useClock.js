import { useEffect, useState } from "react";

/** Jam yang berdetak tepat di batas menit (atau detik). Tidak aktif jika `enabled` false. */
export function useClock(enabled, perSecond = false) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    if (!enabled) return;
    let id;
    const tick = () => {
      const d = new Date();
      setNow(d);
      const wait = perSecond ? 1000 - d.getMilliseconds() : 60_000 - (d.getSeconds() * 1000 + d.getMilliseconds());
      id = setTimeout(tick, wait + 20);
    };
    tick();
    return () => clearTimeout(id);
  }, [enabled, perSecond]);
  return now;
}
