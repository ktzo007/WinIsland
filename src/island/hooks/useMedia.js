import { useCallback, useEffect, useRef, useState } from "react";
import { call, useTauriEvent } from "../../shared/tauri";
import { dominantColor } from "../../shared/color";

/** Sesi media aktif (event WinRT GSMTC). Sampul & warna dominan diambil hanya saat lagu berganti. */
export function useMedia(visible) {
  const [info, setInfo] = useState(null);
  const [art, setArt] = useState(null);
  const [color, setColor] = useState(null);
  const artId = useRef(0);

  const apply = useCallback(async (p) => {
    setInfo(p);
    if (!p) {
      artId.current = 0;
      setArt(null);
      setColor(null);
    } else if (p.artId !== artId.current) {
      artId.current = p.artId;
      const a = await call("media_art");
      setArt(a);
      setColor(a ? await dominantColor(a) : null);
    }
  }, []);

  useTauriEvent("media-update", apply);

  useEffect(() => {
    if (visible) call("media_refresh");
  }, [visible]);

  const control = useCallback((action) => call("media_control", { action }), []);
  const seek = useCallback((ms) => call("media_seek", { ms: Math.round(ms) }), []);
  return { info, art, color, control, seek, active: !!info };
}
