import { useEffect, useRef } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { getCurrentWebview } from "@tauri-apps/api/webview";
import { startDrag } from "@crabnebula/tauri-plugin-drag";

/** invoke yang tidak pernah melempar error (UI tidak boleh crash karena IPC). */
export const call = (cmd, args) => invoke(cmd, args).catch(() => null);

export const windowLabel = () => {
  try {
    return getCurrentWebview().label;
  } catch {
    return "main";
  }
};

/** Berlangganan event Rust. Listener SELALU di-unlisten saat unmount (anti-leak). */
export function useTauriEvent(name, handler) {
  const ref = useRef(handler);
  ref.current = handler;
  useEffect(() => {
    let off = null;
    let dead = false;
    listen(name, (e) => ref.current(e.payload)).then((fn) => (dead ? fn() : (off = fn)));
    return () => {
      dead = true;
      off?.();
    };
  }, [name]);
}

/** Drag & drop file dari Explorer ke jendela (event native Tauri berisi path asli). */
export function useFileDrop({ onEnter, onLeave, onDrop }) {
  const ref = useRef({ onEnter, onLeave, onDrop });
  ref.current = { onEnter, onLeave, onDrop };
  useEffect(() => {
    let off = null;
    let dead = false;
    getCurrentWebview()
      .onDragDropEvent(({ payload }) => {
        const c = ref.current;
        if (payload.type === "enter") c.onEnter();
        else if (payload.type === "leave") c.onLeave();
        else if (payload.type === "drop") c.onDrop(payload.paths);
      })
      .then((fn) => (dead ? fn() : (off = fn)));
    return () => {
      dead = true;
      off?.();
    };
  }, []);
}

let iconPath = null;
/** Tarik file keluar dari kapsul ke aplikasi lain (chat, folder, dll). */
export async function dragOut(path) {
  iconPath ??= await call("drag_icon");
  if (iconPath) startDrag({ item: [path], icon: iconPath }).catch(() => {});
}

// Cache ikon di memori webview (data-URL PNG dari Rust).
const iconCache = new Map();
export function getIcon(path) {
  if (!path) return Promise.resolve(null);
  if (!iconCache.has(path)) iconCache.set(path, call("get_icon", { path }));
  return iconCache.get(path);
}
