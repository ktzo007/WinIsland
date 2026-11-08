import { useEffect, useState } from "react";
import { call, useTauriEvent } from "../../shared/tauri";

export function usePrivacy(visible) {
  const [state, setState] = useState({ cam: false, mic: false });
  useTauriEvent("privacy-update", setState);
  useEffect(() => {
    if (visible) call("get_privacy").then((r) => r && setState(r));
  }, [visible]);
  return state;
}
