import { useCallback, useEffect, useState } from "react";
import { call, useTauriEvent } from "../../shared/tauri";

/** Riwayat clipboard (teks). Rust menyimpan 5–100 item di memori (hilang saat aplikasi ditutup). */
export function useClipboard(visible, enabled, max) {
  const [items, setItems] = useState([]);
  const [pins, setPins] = useState([]);

  useTauriEvent("clipboard-update", (t) => enabled && setItems((p) => [t, ...p.filter((x) => x !== t)].slice(0, max)));

  useEffect(() => {
    if (!enabled) setItems([]);
    else if (visible) call("clipboard_history").then((r) => r && setItems(r));
  }, [visible, enabled]);

  const paste = useCallback((text) => call("clipboard_paste", { text }), []);
  const copy = useCallback((text) => call("clipboard_set", { text }), []);
  const remove = useCallback((text) => {
    setItems((p) => p.filter((x) => x !== text));
    setPins((p) => p.filter((x) => x !== text));
    call("clipboard_remove", { text });
  }, []);
  const clear = useCallback(() => {
    setItems([]);
    call("clipboard_clear");
  }, []);
  const togglePin = useCallback((text) => setPins((p) => (p.includes(text) ? p.filter((x) => x !== text) : [text, ...p])), []);

  // pin di atas, sisanya urut terbaru
  const list = [...pins, ...items.filter((x) => !pins.includes(x))];
  return { items, list, pins, paste, copy, remove, clear, togglePin };
}
