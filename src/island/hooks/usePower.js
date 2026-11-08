import { useEffect, useState } from "react";
import { call, useTauriEvent } from "../../shared/tauri";

const EMPTY = { hasBattery: false, ac: true, charging: false, percent: null, minutesLeft: null, loaded: false };

export function usePower(visible) {
  const [p, setP] = useState(EMPTY);
  useTauriEvent("power-update", (r) => setP({ ...r, loaded: true }));
  useEffect(() => {
    if (visible) call("get_power").then((r) => r && setP({ ...r, loaded: true }));
  }, [visible]);
  return p;
}
