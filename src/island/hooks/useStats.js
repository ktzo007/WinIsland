import { useEffect, useState } from "react";
import { call } from "../../shared/tauri";

/**
 * CPU/RAM/Disk hanya diquery selama `enabled` (panel Sistem terbuka). Sampel pertama untuk
 * priming, kedua 600 ms kemudian, lalu tiap 2000 ms. `enabled` false → timer dibersihkan.
 */
export function useStats(enabled) {
  const [s, setS] = useState({ cur: null, cpu: [], ram: [] });
  useEffect(() => {
    if (!enabled) return;
    let alive = true;
    let timer;
    const poll = async (next) => {
      const r = await call("get_stats");
      if (!alive) return;
      if (r) {
        setS((p) => ({
          cur: r,
          cpu: [...p.cpu, r.cpu ?? p.cpu.at(-1) ?? 0].slice(-30),
          ram: [...p.ram, r.ramPercent].slice(-30),
        }));
      }
      timer = setTimeout(() => poll(2000), next);
    };
    poll(600);
    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, [enabled]);
  return s;
}
