import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import "../styles/dock.css";
import { call, useTauriEvent } from "../shared/tauri";
import { updateSettings, useSettings } from "../shared/settings";
import { FileIcon } from "../shared/ui";
import { Icon } from "../shared/Icon";
import { baseName, stem } from "../shared/format";

const GAP = 8;
const PAD = 10;
const norm = (s) => (s || "").toLowerCase().replace(/[^a-z0-9]/g, "");

/** Apakah jendela `w` milik item dock `it`? exe → cocok persis; .lnk/lainnya → heuristik nama. */
function matches(it, w) {
  const p = it.path.toLowerCase();
  if (p.endsWith(".exe")) return w.exe.toLowerCase() === p;
  const st = norm(stem(it.path));
  const ex = norm(stem(w.exe));
  return st.length > 2 && (ex.includes(st) || norm(w.title).includes(st) || (ex.length > 3 && st.includes(ex)));
}

export default function Dock() {
  const s = useSettings();
  const d = s.dock;
  const [visible, setVisible] = useState(true);
  const [wins, setWins] = useState([]);
  const [hover, setHover] = useState(false);
  const [menu, setMenu] = useState(null); // { i, x }
  const [tip, setTip] = useState(null); // index
  const [bounce, setBounce] = useState(null);
  const itemEls = useRef([]);
  const tipEl = useRef(null);
  const pillRef = useRef(null);
  const cycle = useRef({});
  const raf = useRef(0);
  const leaveT = useRef(0);
  const refreshT = useRef(0);

  useTauriEvent("island-visibility", setVisible);

  const refresh = useCallback(async () => {
    const r = await call("list_windows");
    if (Array.isArray(r)) setWins(r);
  }, []);
  const refreshSoon = useCallback((ms = 500) => {
    clearTimeout(refreshT.current);
    refreshT.current = setTimeout(refresh, ms);
  }, [refresh]);
  useEffect(() => () => { clearTimeout(refreshT.current); clearTimeout(leaveT.current); cancelAnimationFrame(raf.current); }, []);

  // Daftar jendela hanya dimuat saat: tampil, dihover, atau foreground berubah (event dari Rust).
  useEffect(() => { if (visible) refresh(); }, [visible, refresh]);
  useTauriEvent("foreground-changed", () => visible && refreshSoon(450));

  // ── item: tersemat + aplikasi berjalan yang belum tersemat ──
  const items = useMemo(() => {
    const out = d.pinned.map((p) => ({ key: "p:" + p.path, path: p.path, name: p.name || stem(p.path), pinned: true, wins: wins.filter((w) => matches(p, w)) }));
    if (d.showRunning) {
      const seen = new Set();
      for (const w of wins) {
        if (!w.exe || out.some((o) => o.wins.includes(w)) || seen.has(w.exe.toLowerCase())) continue;
        seen.add(w.exe.toLowerCase());
        out.push({ key: "r:" + w.exe, path: w.exe, name: stem(w.exe), pinned: false, wins: wins.filter((x) => x.exe === w.exe) });
      }
    }
    return out;
  }, [d.pinned, d.showRunning, wins]);
  const firstRunning = items.findIndex((x) => !x.pinned);
  const activeKey = wins[0] ? items.find((it) => it.wins.includes(wins[0]))?.key : null;

  // ── magnifikasi (hanya transform; tanpa reflow) ──
  const size = d.size;
  const mag = d.magnify;
  const apply = useCallback(
    (px) => {
      const n = items.length;
      const sig = size * 1.15;
      const base = (i) => PAD + i * (size + GAP) + size / 2 + (i >= firstRunning && firstRunning > 0 ? 13 : 0);
      const sc = items.map((_, i) => (px == null ? 1 : 1 + (mag - 1) * Math.exp(-((px - base(i)) ** 2) / (2 * sig * sig))));
      const ex = sc.map((v) => (v - 1) * size);
      const E = ex.reduce((a, b) => a + b, 0);
      let acc = 0;
      for (let i = 0; i < n; i++) {
        const tx = acc + ex[i] / 2 - E / 2;
        acc += ex[i];
        const el = itemEls.current[i];
        if (el) el.style.transform = `translate3d(${tx.toFixed(1)}px,0,0) scale(${sc[i].toFixed(3)})`;
        if (i === tip && tipEl.current) tipEl.current.style.transform = `translate3d(${(base(i) + tx).toFixed(1)}px,${(-(sc[i] - 1) * size).toFixed(1)}px,0)`;
      }
    },
    [items, size, mag, firstRunning, tip]
  );
  useLayoutEffect(() => apply(null), [apply]);

  const onMove = (e) => {
    const r = pillRef.current.getBoundingClientRect();
    const px = e.clientX - r.left;
    cancelAnimationFrame(raf.current);
    raf.current = requestAnimationFrame(() => apply(px));
    // item yang sedang dihover → tooltip
    let idx = -1;
    for (let i = 0; i < items.length; i++) {
      const c = PAD + i * (size + GAP) + size / 2 + (i >= firstRunning && firstRunning > 0 ? 13 : 0);
      if (Math.abs(px - c) <= (size + GAP) / 2) idx = i;
    }
    setTip(idx < 0 ? null : idx);
  };

  const onEnter = () => {
    clearTimeout(leaveT.current);
    if (!hover) {
      setHover(true);
      refresh();
    }
  };
  const onLeave = () => {
    clearTimeout(leaveT.current);
    leaveT.current = setTimeout(() => {
      setHover(false);
      setMenu(null);
      setTip(null);
      cancelAnimationFrame(raf.current);
      apply(null);
    }, d.autohide ? 380 : 120);
  };

  // ── aksi ──
  const open = (it, i) => {
    if (it.wins.length) {
      const k = (cycle.current[it.key] = ((cycle.current[it.key] ?? -1) + 1) % it.wins.length);
      call("activate_window", { hwnd: it.wins[k].hwnd });
    } else {
      call("launch", { path: it.path });
      setBounce(it.key);
      setTimeout(() => setBounce(null), 1000);
      refreshSoon(1400);
      setTimeout(refresh, 3500);
    }
    setMenu(null);
  };
  const unpin = (it) => updateSettings({ dock: { pinned: d.pinned.filter((p) => p.path !== it.path) } });
  const pin = (it) => updateSettings({ dock: { pinned: [...d.pinned, { path: it.path, name: it.name }] } });

  // Seret-reorder item tersemat
  const drag = useRef(null);
  const [dragI, setDragI] = useState(null);
  const onDown = (e, i) => {
    if (e.button !== 0 || !items[i].pinned) return;
    drag.current = { i, x: e.clientX, active: false };
  };
  const onDragMove = (e) => {
    const g = drag.current;
    if (!g) return;
    if (!g.active && Math.abs(e.clientX - g.x) > 6) {
      g.active = true;
      setDragI(g.i);
    }
  };
  const onUp = (e) => {
    const g = drag.current;
    drag.current = null;
    if (!g?.active) return;
    const r = pillRef.current.getBoundingClientRect();
    const slot = Math.round((e.clientX - r.left - PAD - size / 2) / (size + GAP));
    const to = Math.max(0, Math.min(d.pinned.length - 1, slot));
    setDragI(null);
    if (to !== g.i) {
      const next = [...d.pinned];
      const [m] = next.splice(g.i, 1);
      next.splice(to, 0, m);
      updateSettings({ dock: { pinned: next } });
    }
    e.stopPropagation();
    suppressClick.current = true;
    setTimeout(() => (suppressClick.current = false), 50);
  };
  const suppressClick = useRef(false);

  // ── area klik native (SetWindowRgn) ──
  const hidden = d.autohide && !hover && !menu;
  const region = useRef({ w: 0, h: 0 });
  useLayoutEffect(() => {
    if (!visible) return;
    const pill = pillRef.current;
    let t;
    const send = () => {
      const r = pill.getBoundingClientRect();
      const w = hidden ? 380 : Math.ceil(r.width) + 24;
      const h = hidden ? 10 : menu ? 310 : Math.ceil(r.height + (mag - 1) * size + 40);
      const prev = region.current;
      const apply2 = (a, b) => {
        region.current = { w: a, h: b };
        call("set_island_shape", { w: a, h: b });
      };
      clearTimeout(t);
      if (w >= prev.w && h >= prev.h) apply2(w, h);
      else {
        apply2(Math.max(w, prev.w), Math.max(h, prev.h));
        t = setTimeout(() => apply2(w, h), 520);
      }
    };
    send();
    const ro = new ResizeObserver(send);
    ro.observe(pill);
    return () => {
      ro.disconnect();
      clearTimeout(t);
    };
  }, [visible, hidden, menu, items.length, size, mag]);

  if (!visible) return null;

  const tipItem = tip != null ? items[tip] : null;
  const menuItem = menu ? items[menu.i] : null;

  return (
    <div className="dock-root" data-hidden={hidden ? "1" : undefined} onMouseEnter={onEnter} onMouseLeave={onLeave} onClick={() => setMenu(null)}>
      <div className="dock-wrap">
        <div ref={pillRef} className="dock" style={{ "--s": `${size}px`, padding: PAD }} onMouseMove={onMove} onMouseUp={onUp} onPointerMove={onDragMove}>
          {items.length === 0 && (
            <div className="dock-empty">
              <Icon name="grid" size={15} /> Tambahkan aplikasi di Pengaturan → Dock
            </div>
          )}
          {items.map((it, i) => (
            <div key={it.key} className="slot" style={{ marginLeft: i === firstRunning && i > 0 ? 26 : 0 }}>
              {i === firstRunning && i > 0 && <i className="sep" />}
              <button
                ref={(el) => (itemEls.current[i] = el)}
                type="button"
                className="ditem"
                data-bounce={bounce === it.key ? "1" : undefined}
                data-drag={dragI === i ? "1" : undefined}
                aria-label={it.name}
                onMouseDown={(e) => onDown(e, i)}
                onClick={(e) => { e.stopPropagation(); if (!suppressClick.current) open(it, i); }}
                onAuxClick={(e) => { if (e.button === 1) { e.stopPropagation(); call("launch", { path: it.path }); } }}
                onContextMenu={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  const r = pillRef.current.getBoundingClientRect();
                  setMenu({ i, x: Math.max(8, Math.min(r.width - 168, PAD + i * (size + GAP) + size / 2 - 80)) });
                }}
              >
                <FileIcon path={it.path} size={size} radius={size * 0.22} />
                {it.wins.length > 0 && <u data-on={it.key === activeKey ? "1" : undefined} data-n={Math.min(3, it.wins.length)} />}
              </button>
            </div>
          ))}
          {tipItem && !menu && (
            <div ref={tipEl} className="tip" key={tip}>
              {tipItem.name}
            </div>
          )}
          {menuItem && (
            <div className="dmenu" style={{ left: menu.x }} onClick={(e) => e.stopPropagation()}>
              <b>{menuItem.name}</b>
              <button type="button" onClick={() => open(menuItem, menu.i)}>{menuItem.wins.length ? "Tampilkan jendela" : "Buka"}</button>
              {menuItem.wins.length > 0 && <button type="button" onClick={() => { call("launch", { path: menuItem.path }); setMenu(null); refreshSoon(1500); }}>Jendela baru</button>}
              {menuItem.wins.slice(0, 4).map((w) => (
                <button key={w.hwnd} type="button" className="win" onClick={() => { call("activate_window", { hwnd: w.hwnd }); setMenu(null); }}>
                  {w.title.length > 30 ? w.title.slice(0, 29) + "…" : w.title}
                </button>
              ))}
              {menuItem.wins.length > 0 && <button type="button" className="danger" onClick={() => { menuItem.wins.forEach((w) => call("close_window", { hwnd: w.hwnd })); setMenu(null); refreshSoon(900); }}>Tutup {menuItem.wins.length > 1 ? "semua jendela" : "jendela"}</button>}
              {menuItem.pinned ? <button type="button" onClick={() => { unpin(menuItem); setMenu(null); }}>Lepas sematan</button> : <button type="button" onClick={() => { pin(menuItem); setMenu(null); }}>Sematkan ke dock</button>}
            </div>
          )}
        </div>
      </div>
      <div className="hot" onMouseEnter={onEnter} />
    </div>
  );
}
