import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, LazyMotion, domMax, m } from "framer-motion";

import { call, useFileDrop, useTauriEvent } from "../shared/tauri";
import { useSettings } from "../shared/settings";
import { hexToRgb } from "../shared/color";
import { SPRING, SPRING_ECO, TABS, TAB_BAR_H, sizeFor } from "./tabs";

import { useAgenda } from "./hooks/useAgenda";
import { useAudio } from "./hooks/useAudio";
import { useClipboard } from "./hooks/useClipboard";
import { useClock } from "./hooks/useClock";
import { useFocus } from "./hooks/useFocus";
import { useMedia } from "./hooks/useMedia";
import { usePower } from "./hooks/usePower";
import { usePrivacy } from "./hooks/usePrivacy";
import { useShelf } from "./hooks/useShelf";
import { useStats } from "./hooks/useStats";
import { useToasts } from "./hooks/useToasts";
import { useWeather } from "./hooks/useWeather";

import Idle from "./Idle";
import Toast from "./Toast";
import TabBar from "./TabBar";
import MediaPanel from "./panels/MediaPanel";
import SystemPanel from "./panels/SystemPanel";
import CalendarPanel from "./panels/CalendarPanel";
import ClipboardPanel from "./panels/ClipboardPanel";
import ShelfPanel from "./panels/ShelfPanel";
import FocusPanel from "./panels/FocusPanel";
import ControlsPanel from "./panels/ControlsPanel";

const PANELS = { media: MediaPanel, system: SystemPanel, calendar: CalendarPanel, clipboard: ClipboardPanel, shelf: ShelfPanel, focus: FocusPanel, controls: ControlsPanel };

export default function Island() {
  const s = useSettings();
  const perf = s.general.perf;

  // `visible` = false saat Rust menyembunyikan jendela (Game Mode / sembunyi manual).
  const [visible, setVisible] = useState(true);
  const [hover, setHover] = useState(false);
  const [pinned, setPinned] = useState(false);
  const [peek, setPeek] = useState(false);
  const [editing, setEditing] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [tab, setTab] = useState("media");
  const [keepAwake, setKeepAwakeState] = useState(false);
  useTauriEvent("island-visibility", setVisible);

  // ── data ──
  const media = useMedia(visible);
  const privacy = usePrivacy(visible);
  const power = usePower(visible);
  const audio = useAudio(visible);
  const shelf = useShelf();
  const clip = useClipboard(visible, s.clipboard.enabled, s.clipboard.max);
  const { toast, push, dismiss } = useToasts();

  const focus = useFocus(visible, s.widgets.focusMin, s.widgets.breakMin, (kind, phase) =>
    push(
      kind === "pomodoro"
        ? phase === "focus"
          ? { kind: "focus", title: "Sesi fokus selesai", sub: "Waktunya rehat sebentar" }
          : { kind: "focus", title: "Rehat selesai", sub: "Siap fokus lagi?" }
        : { kind: "focus", title: "Timer selesai", sub: "Waktu habis" },
      6000
    )
  );
  const agenda = useAgenda(visible, (e) => push({ kind: "info", icon: "bell", title: e.text, sub: `Pengingat · ${e.time}` }, 7000));

  const tabs = useMemo(() => s.island.tabs.filter((k) => TABS[k]), [s.island.tabs]);
  const curTab = tabs.includes(tab) ? tab : tabs[0] ?? "media";
  const expanded = hover || pinned || peek || editing || dragging;
  const mode = expanded ? (dragging && tabs.includes("shelf") ? "shelf" : curTab) : toast ? "toast" : "idle";
  const group = mode === "idle" ? "idle" : mode === "toast" ? "toast" : "exp";
  const size = sizeFor(mode);

  const now = useClock(visible && (s.island.showClock || mode === "calendar"));
  const stats = useStats(visible && hover && mode === "system");
  const weather = useWeather(s.widgets.weatherOn, s.widgets.weatherCity, s.widgets.weatherUnit, visible && mode === "calendar");

  // ── drag & drop file → Shelf ──
  useFileDrop({
    onEnter: () => setDragging(true),
    onLeave: () => setDragging(false),
    onDrop: (paths) => {
      shelf.add(paths);
      setDragging(false);
      setHover(true);
      setTab("shelf");
    },
  });

  // ── hotkey global (event dari Rust) ──
  useTauriEvent("hotkey", (name) => {
    if (name === "clipboard") {
      setTab("clipboard");
      setPeek(true);
    } else if (name.startsWith("dock-")) {
      const n = Number(name.slice(5)) - 1;
      const it = s.dock.pinned[n];
      if (it) call("launch", { path: it.path });
    }
  });
  useEffect(() => {
    if (!peek) return;
    const t = setTimeout(() => setPeek(false), 6000);
    return () => clearTimeout(t);
  }, [peek]);

  // ── hover dengan jeda kecil agar kursor yang hanya lewat tidak membuka kapsul ──
  const timer = useRef(0);
  const onEnter = () => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setHover(true), s.general.hoverDelay);
  };
  const onLeave = () => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      setHover(false);
      setPeek(false);
    }, 320);
  };
  useEffect(() => () => clearTimeout(timer.current), []);

  // Saat membuka & tidak ada musik → lompat ke panel pertama selain Musik.
  const wasExpanded = useRef(false);
  useEffect(() => {
    if (expanded && !wasExpanded.current && curTab === "media" && !media.active) {
      const alt = tabs.find((k) => k !== "media");
      if (alt) setTab(alt);
    }
    wasExpanded.current = expanded;
  }, [expanded]); // eslint-disable-line

  // ── toast otomatis ("live activity") ──
  const prevTitle = useRef(null);
  useEffect(() => {
    const t = media.info?.title ?? null;
    if (prevTitle.current !== null && t && t !== prevTitle.current && media.info?.playing && s.island.toastTrack && !expanded) {
      push({ kind: "track", title: t, artist: media.info.artist || media.info.album }, 3600);
    }
    prevTitle.current = t;
  }, [media.info?.title]); // eslint-disable-line

  const prevPower = useRef(null);
  useEffect(() => {
    if (!power.loaded) return; // abaikan transisi dari state awal kosong → data nyata
    const p = prevPower.current;
    if (p && s.island.toastPower && power.hasBattery) {
      if (p.ac !== power.ac) {
        push(power.ac ? { kind: "power", title: "Charger terhubung", sub: "Baterai mengisi", pct: power.percent } : { kind: "power", title: "Charger dilepas", sub: "Berjalan dengan baterai", pct: power.percent, low: false });
      } else if (!power.ac && power.percent != null && p.percent > 20 && power.percent <= 20) {
        push({ kind: "power", low: true, title: "Baterai lemah", sub: "Hubungkan charger", pct: power.percent }, 5000);
      }
    }
    prevPower.current = power;
  }, [power.ac, power.percent]); // eslint-disable-line

  const prevPrivacy = useRef({ cam: false, mic: false });
  useEffect(() => {
    const p = prevPrivacy.current;
    if (s.island.toastPrivacy && ((privacy.cam && !p.cam) || (privacy.mic && !p.mic))) push({ kind: "privacy", cam: privacy.cam, mic: privacy.mic }, 3600);
    prevPrivacy.current = privacy;
  }, [privacy.cam, privacy.mic]); // eslint-disable-line

  useEffect(() => {
    if (!s.island.toastClipboard || expanded || !clip.items[0]) return;
    push({ kind: "info", icon: "copy", title: "Disalin ke clipboard", sub: clip.items[0].slice(0, 44) }, 1800);
  }, [clip.items[0]]); // eslint-disable-line

  // ── gestur ──
  const wheelOk = s.island.wheelVolume && (mode === "idle" || mode === "toast" || mode === "media" || mode === "controls");
  const onWheel = (e) => {
    if (!wheelOk) return;
    audio.nudge(-Math.sign(e.deltaY) * 0.03);
    if (mode === "idle" || mode === "toast") push({ kind: "volume" }, 1400);
  };
  const setKeepAwake = (on) => {
    setKeepAwakeState(on);
    call("keep_awake", { on });
  };

  // ── terapkan pengaturan ke backend Rust (island = jendela yang selalu hidup) ──
  const g = s.general;
  useEffect(() => void call("set_hide_in_fullscreen", { on: g.hideInFullscreen }), [g.hideInFullscreen]);
  useEffect(() => void call("hotkeys_enable", { on: g.hotkeys }), [g.hotkeys]);
  useEffect(() => void call("set_target_monitor", { index: g.monitor }), [g.monitor]);
  useEffect(() => void call("autostart_set", { on: g.launchAtLogin }), [g.launchAtLogin]);
  useEffect(() => void call("clipboard_enable", { on: s.clipboard.enabled, max: s.clipboard.max }), [s.clipboard.enabled, s.clipboard.max]);
  useEffect(() => void call("dock_set_enabled", { on: s.dock.enabled }), [s.dock.enabled]);
  useEffect(() => void call("taskbar_autohide", { on: s.dock.enabled && s.dock.hideTaskbar }), [s.dock.enabled, s.dock.hideTaskbar]);

  // ── sinkron area klik native (SetWindowRgn) dengan ukuran kapsul ──
  // Membesar → region diperbesar dulu; mengecil → region baru dikecilkan setelah animasi selesai.
  const region = useRef({ w: 0, h: 0 });
  useEffect(() => {
    const prev = region.current;
    const apply = (w, h) => {
      region.current = { w, h };
      call("set_island_shape", { w, h });
    };
    if (size.w >= prev.w && size.h >= prev.h) {
      apply(size.w, size.h);
      return;
    }
    apply(Math.max(size.w, prev.w), Math.max(size.h, prev.h));
    const t = setTimeout(() => apply(size.w, size.h), 650);
    return () => clearTimeout(t);
  }, [size.w, size.h]);

  // ── kosongkan working set WebView2 setelah idle 8 dtk ──
  useEffect(() => {
    if (mode !== "idle" || !visible) return;
    const t = setTimeout(() => call("trim_memory"), 8000);
    return () => clearTimeout(t);
  }, [mode, visible]);

  // Game Mode / sembunyi manual → seluruh pohon React di-unmount: tidak ada rAF, timer, maupun listener DOM.
  if (!visible) return null;

  // ── warna aksen & ambient dari sampul ──
  const manual = s.island.accent !== "auto" ? hexToRgb(s.island.accent) : null;
  const accent = manual ?? media.color?.accent ?? [245, 245, 247];
  const ambOn = s.island.ambient && perf !== "eco" && media.color && media.active;
  const amb = ambOn ? media.color.rgb : [0, 0, 0];
  const ambO = !ambOn ? 0 : mode === "media" ? 0.55 : mode === "idle" || mode === "toast" ? (media.info?.playing ? 0.3 : 0) : 0.18;
  const vars = { "--accent-rgb": accent.join(","), "--amb": amb.join(","), "--amb-o": ambO };

  const ctx = { s, media, art: media.art, audio, stats, power, clip, shelf, focus, agenda, weather, now, dragging, keepAwake, setKeepAwake, setEditing };
  const Panel = PANELS[mode];

  return (
    <LazyMotion features={domMax} strict>
      <div className="isl-root" data-perf={perf} style={vars} onMouseEnter={onEnter} onMouseLeave={onLeave} onWheel={onWheel} onContextMenu={() => { setTab("controls"); setPinned(true); }} onAuxClick={(e) => e.button === 1 && media.control("play_pause")}>
        {/* Lapisan bentuk: morph hanya lewat transform (layout projection) + border-radius terkoreksi. */}
        <div className="isl-wrap">
          <m.div
            layout
            layoutDependency={`${size.w}x${size.h}`}
            transition={perf === "eco" ? SPRING_ECO : SPRING}
            className="isl-shape"
            style={{ width: size.w, height: size.h, borderRadius: Math.min(size.h / 2, expanded ? 30 : 999) }}
            onDoubleClick={() => setPinned((p) => !p)}
          />
        </div>

        {/* Lapisan isi: cross-fade opacity saja, tidak ikut ter-scale saat morph. */}
        <AnimatePresence initial={false}>
          <m.div
            key={group}
            className="isl-wrap"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, transition: { duration: 0.16, delay: 0.06 } }}
            exit={{ opacity: 0, transition: { duration: 0.08 } }}
          >
            <div className="isl-content" style={{ width: size.w, height: size.h, borderRadius: Math.min(size.h / 2, group === "exp" ? 30 : 999) }}>
              {group === "idle" && <Idle media={media.info} focus={focus} privacy={privacy} power={power} now={now} s={s} />}
              {group === "toast" && toast && <Toast t={toast} art={media.art} audio={audio} />}
              {group === "exp" && (
                <div className="exp">
                  <TabBar tabs={tabs} tab={mode} onTab={setTab} pinned={pinned || editing} onPin={() => setPinned((p) => !p)} badges={{ media: !!media.info?.playing, shelf: shelf.files.length > 0, clipboard: false }} />
                  <div className="exp-body" style={{ height: TABS[mode].h }}>
                    <AnimatePresence initial={false}>
                      <m.div key={mode} className="exp-panel" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0, transition: { duration: 0.2, delay: 0.04 } }} exit={{ opacity: 0, transition: { duration: 0.08 } }}>
                        <Panel ctx={ctx} />
                      </m.div>
                    </AnimatePresence>
                  </div>
                </div>
              )}
            </div>
          </m.div>
        </AnimatePresence>
      </div>
    </LazyMotion>
  );
}
