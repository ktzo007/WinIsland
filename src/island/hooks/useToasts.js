import { useCallback, useEffect, useRef, useState } from "react";

/** Satu toast aktif pada satu waktu ("live activity"). Timer dibersihkan saat unmount. */
export function useToasts() {
  const [toast, setToast] = useState(null);
  const timer = useRef(0);
  const seq = useRef(0);
  const push = useCallback((t, ms = 3200) => {
    clearTimeout(timer.current);
    setToast({ ...t, id: ++seq.current });
    timer.current = setTimeout(() => setToast(null), ms);
  }, []);
  const dismiss = useCallback(() => {
    clearTimeout(timer.current);
    setToast(null);
  }, []);
  useEffect(() => () => clearTimeout(timer.current), []);
  return { toast, push, dismiss };
}
