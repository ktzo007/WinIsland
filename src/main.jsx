import { lazy, Suspense } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import "./styles/base.css";
import "./styles/island.css";
import { windowLabel } from "./shared/tauri";
import Island from "./island/Island.jsx";

// Satu bundle, tiga jendela. Dock & Pengaturan dimuat malas → island tetap kecil & cepat.
const Dock = lazy(() => import("./dock/Dock.jsx"));
const Settings = lazy(() => import("./settings/Settings.jsx"));

document.addEventListener("contextmenu", (e) => e.preventDefault());

const label = windowLabel();
const View = label === "dock" ? Dock : label === "settings" ? Settings : Island;
createRoot(document.getElementById("root")).render(
  <Suspense fallback={null}>
    {label === "main" ? <Island /> : <View />}
  </Suspense>
);
