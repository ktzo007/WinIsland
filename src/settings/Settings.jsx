import { useEffect, useMemo, useState } from "react";
import "../styles/settings.css";
import { Icon, IconButton } from "../shared/Icon";
import { call } from "../shared/tauri";
import { DEFAULTS, getSettings, resetSettings, updateSettings, useSettings } from "../shared/settings";
import { FileIcon, Slider } from "../shared/ui";
import { stem } from "../shared/format";
import { TABS } from "../island/tabs";

// ───────── kontrol dasar ─────────
const Row = ({ title, desc, children }) => (
  <div className="row">
    <div className="rt">
      <b>{title}</b>
      {desc && <span>{desc}</span>}
    </div>
    <div className="rc">{children}</div>
  </div>
);
const Group = ({ title, children }) => (
  <section className="group-wrap">
    {title && <h3>{title}</h3>}
    <div className="group">{children}</div>
  </section>
);
const Toggle = ({ on, onChange, label }) => (
  <button type="button" role="switch" aria-checked={!!on} aria-label={label} className="tg" data-on={on ? "1" : undefined} onClick={() => onChange(!on)}>
    <i />
  </button>
);
const Seg = ({ value, options, onChange }) => (
  <div className="sseg">
    {options.map(([v, n]) => (
      <button key={String(v)} type="button" data-on={value === v ? "1" : undefined} onClick={() => onChange(v)}>
        {n}
      </button>
    ))}
  </div>
);
function Range({ value, min, max, step = 1, onChange, fmt = (v) => v }) {
  return (
    <div className="range">
      <Slider value={(value - min) / (max - min)} onChange={(r) => onChange(Math.round((min + r * (max - min)) / step) * step)} label="" />
      <span className="num">{fmt(value)}</span>
    </div>
  );
}

async function pickApp() {
  try {
    const { open } = await import("@tauri-apps/plugin-dialog");
    const p = await open({ multiple: false, filters: [{ name: "Aplikasi & pintasan", extensions: ["exe", "lnk", "bat", "url"] }] });
    return typeof p === "string" ? p : null;
  } catch {
    return null;
  }
}

/** Editor daftar aplikasi (dock & pintasan): nama, urut, hapus. */
function AppList({ items, onChange, empty }) {
  const set = (i, patch) => onChange(items.map((it, k) => (k === i ? { ...it, ...patch } : it)));
  const move = (i, d) => {
    const j = i + d;
    if (j < 0 || j >= items.length) return;
    const next = [...items];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };
  if (!items.length) return <div className="aempty">{empty}</div>;
  return (
    <div className="alist2">
      {items.map((it, i) => (
        <div key={it.path} className="arow">
          {/^https?:/i.test(it.path) ? <span className="gl"><Icon name="globe" size={18} /></span> : <FileIcon path={it.path} size={30} radius={8} />}
          <div className="ainfo">
            <input value={it.name} onChange={(e) => set(i, { name: e.target.value })} aria-label="Nama" />
            <span title={it.path}>{it.path}</span>
          </div>
          <IconButton name="chevU" size={14} label="Naik" className="sm" disabled={i === 0} onClick={() => move(i, -1)} />
          <IconButton name="chevD" size={14} label="Turun" className="sm" disabled={i === items.length - 1} onClick={() => move(i, 1)} />
          <IconButton name="trash" size={14} label="Hapus" className="sm" onClick={() => onChange(items.filter((_, k) => k !== i))} />
        </div>
      ))}
    </div>
  );
}

const ACCENTS = ["auto", "#f5f5f7", "#7dd3fc", "#6ee7b7", "#fdba74", "#c4b5fd", "#fda4af"];

// ───────── halaman ─────────
function General({ s }) {
  const g = s.general;
  const [mons, setMons] = useState([]);
  useEffect(() => { call("list_monitors").then((r) => Array.isArray(r) && setMons(r)); }, []);
  const set = (p) => updateSettings({ general: p });
  return (
    <>
      <Group title="Peluncuran">
        <Row title="Mulai bersama Windows" desc="Jalankan otomatis saat Anda masuk."><Toggle on={g.launchAtLogin} onChange={(v) => set({ launchAtLogin: v })} label="Mulai bersama Windows" /></Row>
        <Row title="Monitor" desc="Tempat island dan dock ditampilkan.">
          <select className="sel" value={g.monitor} onChange={(e) => set({ monitor: Number(e.target.value) })}>
            {(mons.length ? mons : [{ index: 0, name: "Monitor utama", width: 0, height: 0 }]).map((m) => (
              <option key={m.index} value={m.index}>{m.name}{m.width ? ` — ${m.width}×${m.height}` : ""}{m.primary ? " (utama)" : ""}</option>
            ))}
          </select>
        </Row>
      </Group>
      <Group title="Performa">
        <div className="perf">
          {[
            ["eco", "Hemat", "Tanpa ambient, visualizer, dan spring — paling irit baterai & GPU."],
            ["balanced", "Seimbang", "Animasi penuh, visualizer 30 fps. Cocok untuk harian."],
            ["ultra", "Ultra", "Visualizer 60 fps + cahaya ambient bergerak."],
          ].map(([k, n, d]) => (
            <button key={k} type="button" className="pcard" data-on={g.perf === k ? "1" : undefined} onClick={() => set({ perf: k })}>
              <b>{n}</b>
              <span>{d}</span>
            </button>
          ))}
        </div>
        <Row title="Sembunyikan saat fullscreen / game" desc="SW_HIDE otomatis + semua listener dilepas, 0% beban saat bermain."><Toggle on={g.hideInFullscreen} onChange={(v) => set({ hideInFullscreen: v })} label="Sembunyikan saat fullscreen" /></Row>
        <Row title="Jeda buka saat hover" desc="Mencegah terbuka saat kursor hanya lewat."><Range value={g.hoverDelay} min={0} max={400} step={10} fmt={(v) => `${v} ms`} onChange={(v) => set({ hoverDelay: v })} /></Row>
      </Group>
      <Group title="Papan ketik">
        <Row title="Hotkey global" desc="Ctrl+Alt+I tampil/sembunyi · Ctrl+Alt+V riwayat clipboard · Ctrl+Alt+1…9 luncurkan item dock."><Toggle on={g.hotkeys} onChange={(v) => set({ hotkeys: v })} label="Hotkey global" /></Row>
      </Group>
    </>
  );
}

function IslandPage({ s }) {
  const i = s.island;
  const set = (p) => updateSettings({ island: p });
  const enabled = i.tabs.filter((k) => TABS[k]);
  const ordered = [...enabled, ...Object.keys(TABS).filter((k) => !enabled.includes(k))];
  const toggleTab = (k) => {
    if (enabled.includes(k)) enabled.length > 1 && set({ tabs: enabled.filter((x) => x !== k) });
    else set({ tabs: [...enabled, k] });
  };
  const move = (k, d) => {
    const a = [...enabled];
    const idx = a.indexOf(k);
    const j = idx + d;
    if (idx < 0 || j < 0 || j >= a.length) return;
    [a[idx], a[j]] = [a[j], a[idx]];
    set({ tabs: a });
  };
  return (
    <>
      <Group title="Panel">
        {ordered.map((k) => (
          <Row key={k} title={TABS[k].label} desc={null}>
            <IconButton name="chevU" size={14} label="Naik" className="sm" disabled={!enabled.includes(k) || enabled[0] === k} onClick={() => move(k, -1)} />
            <IconButton name="chevD" size={14} label="Turun" className="sm" disabled={!enabled.includes(k) || enabled.at(-1) === k} onClick={() => move(k, 1)} />
            <Toggle on={enabled.includes(k)} onChange={() => toggleTab(k)} label={TABS[k].label} />
          </Row>
        ))}
      </Group>
      <Group title="Tampilan">
        <Row title="Warna aksen" desc="Otomatis mengambil warna dominan sampul album.">
          <div className="sw">
            {ACCENTS.map((c) => (
              <button key={c} type="button" className={`swatch ${c === "auto" ? "auto" : ""}`} data-on={i.accent === c ? "1" : undefined} style={c === "auto" ? undefined : { background: c }} aria-label={c} onClick={() => set({ accent: c })}>
                {c === "auto" && <Icon name="sparkle" size={13} />}
              </button>
            ))}
          </div>
        </Row>
        <Row title="Cahaya ambient dari sampul" desc="Gradien lembut di dalam kapsul (nonaktif pada profil Hemat)."><Toggle on={i.ambient} onChange={(v) => set({ ambient: v })} label="Ambient" /></Row>
        <Row title="Jam saat idle"><Toggle on={i.showClock} onChange={(v) => set({ showClock: v })} label="Jam" /></Row>
        <Row title="Format 24 jam"><Toggle on={i.clock24} onChange={(v) => set({ clock24: v })} label="24 jam" /></Row>
        <Row title="Scroll untuk volume" desc="Gulir roda mouse di atas kapsul. Klik tengah = putar/jeda."><Toggle on={i.wheelVolume} onChange={(v) => set({ wheelVolume: v })} label="Scroll volume" /></Row>
      </Group>
      <Group title="Notifikasi kapsul (live activity)">
        <Row title="Lagu berganti"><Toggle on={i.toastTrack} onChange={(v) => set({ toastTrack: v })} label="Lagu berganti" /></Row>
        <Row title="Charger & baterai lemah"><Toggle on={i.toastPower} onChange={(v) => set({ toastPower: v })} label="Daya" /></Row>
        <Row title="Kamera / mikrofon mulai dipakai"><Toggle on={i.toastPrivacy} onChange={(v) => set({ toastPrivacy: v })} label="Privasi" /></Row>
        <Row title="Teks disalin ke clipboard"><Toggle on={i.toastClipboard} onChange={(v) => set({ toastClipboard: v })} label="Clipboard" /></Row>
      </Group>
    </>
  );
}

function WidgetPage({ s }) {
  const w = s.widgets;
  const set = (p) => updateSettings({ widgets: p });
  return (
    <>
      <Group title="Cuaca">
        <Row title="Tampilkan cuaca di Kalender" desc="Memakai Open-Meteo (tanpa akun). Satu-satunya fitur yang memakai internet; hanya dimuat saat panel Kalender dibuka, di-cache 30 menit."><Toggle on={w.weatherOn} onChange={(v) => set({ weatherOn: v })} label="Cuaca" /></Row>
        <Row title="Kota"><input className="txt" placeholder="mis. Bandar Lampung" value={w.weatherCity} disabled={!w.weatherOn} onChange={(e) => set({ weatherCity: e.target.value })} /></Row>
        <Row title="Satuan suhu"><Seg value={w.weatherUnit} options={[["c", "°C"], ["f", "°F"]]} onChange={(v) => set({ weatherUnit: v })} /></Row>
      </Group>
      <Group title="Fokus">
        <Row title="Durasi fokus (Pomodoro)"><Range value={w.focusMin} min={5} max={90} step={5} fmt={(v) => `${v} mnt`} onChange={(v) => set({ focusMin: v })} /></Row>
        <Row title="Durasi rehat"><Range value={w.breakMin} min={1} max={30} fmt={(v) => `${v} mnt`} onChange={(v) => set({ breakMin: v })} /></Row>
      </Group>
      <Group title="Kalender">
        <Row title="Awal pekan"><Seg value={w.firstDay} options={[[1, "Senin"], [0, "Minggu"]]} onChange={(v) => set({ firstDay: v })} /></Row>
      </Group>
    </>
  );
}

function DockPage({ s }) {
  const d = s.dock;
  const set = (p) => updateSettings({ dock: p });
  const addApp = async () => {
    const p = await pickApp();
    if (p && !d.pinned.some((x) => x.path === p)) set({ pinned: [...d.pinned, { path: p, name: stem(p) }] });
  };
  const importPins = async () => {
    const r = await call("taskbar_pins");
    if (!Array.isArray(r)) return;
    const have = new Set(d.pinned.map((x) => x.path));
    set({ pinned: [...d.pinned, ...r.filter((x) => !have.has(x.path))] });
  };
  return (
    <>
      <Group title="Dock">
        <Row title="Aktifkan dock" desc="Jendela terpisah di tepi bawah. Dibuat saat dihidupkan dan DIHANCURKAN saat dimatikan, sehingga tidak memakan RAM."><Toggle on={d.enabled} onChange={(v) => set({ enabled: v })} label="Aktifkan dock" /></Row>
        <Row title="Sembunyikan otomatis" desc="Dock muncul saat kursor menyentuh tepi bawah layar."><Toggle on={d.autohide} onChange={(v) => set({ autohide: v })} label="Auto-hide" /></Row>
        <Row title="Tampilkan aplikasi yang sedang berjalan"><Toggle on={d.showRunning} onChange={(v) => set({ showRunning: v })} label="Aplikasi berjalan" /></Row>
        <Row title="Sembunyikan taskbar Windows" desc="Memakai auto-hide bawaan Windows; dikembalikan otomatis saat keluar atau jika aplikasi crash."><Toggle on={d.hideTaskbar} onChange={(v) => set({ hideTaskbar: v })} label="Auto-hide taskbar" /></Row>
      </Group>
      <Group title="Tampilan">
        <Row title="Ukuran ikon"><Range value={d.size} min={32} max={64} step={2} fmt={(v) => `${v} px`} onChange={(v) => set({ size: v })} /></Row>
        <Row title="Magnifikasi" desc="Efek membesar saat kursor mendekat (1.0 = mati)."><Range value={d.magnify} min={1} max={2} step={0.1} fmt={(v) => `${v.toFixed(1)}×`} onChange={(v) => set({ magnify: v })} /></Row>
      </Group>
      <Group title="Aplikasi tersemat">
        <div className="toolbar">
          <button type="button" className="btn" onClick={addApp}><Icon name="plus" size={14} /> Tambah aplikasi…</button>
          <button type="button" className="btn ghosty" onClick={importPins}><Icon name="pin" size={14} /> Impor dari taskbar Windows</button>
        </div>
        <AppList items={d.pinned} onChange={(pinned) => set({ pinned })} empty="Belum ada aplikasi. Tambahkan atau impor dari taskbar Windows. Klik kanan ikon di dock untuk melepas sematan." />
      </Group>
    </>
  );
}

function Shortcuts({ s }) {
  const list = s.shortcuts;
  const [url, setUrl] = useState("");
  const set = (shortcuts) => updateSettings({ shortcuts });
  const add = async () => {
    const p = await pickApp();
    if (p && !list.some((x) => x.path === p)) set([...list, { path: p, name: stem(p) }]);
  };
  const addUrl = () => {
    const u = url.trim();
    if (!/^https?:\/\//i.test(u) || list.some((x) => x.path === u)) return;
    set([...list, { path: u, name: u.replace(/^https?:\/\/(www\.)?/i, "").split("/")[0] }]);
    setUrl("");
  };
  return (
    <Group title="Pintasan di panel Kontrol">
      <div className="toolbar">
        <button type="button" className="btn" onClick={add}><Icon name="plus" size={14} /> Tambah aplikasi…</button>
        <input className="txt grow" placeholder="https://… (situs web)" value={url} onChange={(e) => setUrl(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addUrl()} />
        <button type="button" className="btn ghosty" onClick={addUrl}>Tambah situs</button>
      </div>
      <AppList items={list} onChange={set} empty="Belum ada pintasan. Aplikasi dan situs yang Anda tambahkan muncul sebagai tombol cepat di panel Kontrol." />
    </Group>
  );
}

function Privacy({ s }) {
  const c = s.clipboard;
  const set = (p) => updateSettings({ clipboard: p });
  return (
    <>
      <Group title="Riwayat clipboard">
        <Row title="Simpan riwayat salinan" desc="Hanya teks, hanya di memori — tidak pernah ditulis ke disk dan hilang saat aplikasi ditutup. Menonaktifkan akan menghapus riwayat."><Toggle on={c.enabled} onChange={(v) => set({ enabled: v })} label="Riwayat clipboard" /></Row>
        <Row title="Jumlah item maksimum"><Range value={c.max} min={5} max={100} step={5} fmt={(v) => `${v}`} onChange={(v) => set({ max: v })} /></Row>
        <Row title="Hapus riwayat sekarang"><button type="button" className="btn danger" onClick={() => call("clipboard_clear")}><Icon name="trash" size={14} /> Hapus</button></Row>
      </Group>
      <Group title="Yang dilakukan & tidak dilakukan aplikasi ini">
        <div className="note">
          <p>• Salinan dari pengelola kata sandi yang menandai datanya <i>“jangan simpan”</i> otomatis diabaikan.</p>
          <p>• Indikator kamera/mikrofon hanya membaca Registry <i>CapabilityAccess</i> milik Windows — tidak mengakses perangkat.</p>
          <p>• Tidak ada telemetri. Satu-satunya koneksi internet adalah cuaca (opsional, bisa dimatikan).</p>
        </div>
      </Group>
    </>
  );
}

function About({ s }) {
  const [copied, setCopied] = useState(false);
  const diag = () => {
    const txt = JSON.stringify({ app: "DynamicIsland", version: "2.0.0", ua: navigator.userAgent, settings: { ...getSettings(), dock: { ...s.dock, pinned: `${s.dock.pinned.length} item` }, shortcuts: `${s.shortcuts.length} item` } }, null, 2);
    navigator.clipboard?.writeText(txt).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    });
  };
  return (
    <>
      <Group>
        <div className="about">
          <div className="logo"><Icon name="sparkle" size={26} /></div>
          <div>
            <b>Dynamic Island</b>
            <span>Versi 2.0.0 · Tauri v2 + React · tanpa polling saat idle</span>
          </div>
        </div>
      </Group>
      <Group title="Gestur & pintasan">
        <div className="keys">
          {[["Hover", "Buka kapsul"], ["Klik tab", "Pindah panel"], ["Dobel klik", "Sematkan terbuka"], ["Klik tengah", "Putar / jeda"], ["Klik kanan", "Panel Kontrol"], ["Scroll", "Volume"], ["Ctrl+Alt+I", "Tampil / sembunyi"], ["Ctrl+Alt+V", "Riwayat clipboard"], ["Ctrl+Alt+1…9", "Luncurkan item dock"]].map(([k, v]) => (
            <div key={k}><kbd>{k}</kbd><span>{v}</span></div>
          ))}
        </div>
      </Group>
      <Group title="Pemeliharaan">
        <Row title="Salin info diagnostik" desc="Versi & pengaturan (tanpa path pribadi) untuk laporan masalah."><button type="button" className="btn" onClick={diag}>{copied ? "Tersalin ✓" : "Salin"}</button></Row>
        <Row title="Reset semua pengaturan"><button type="button" className="btn danger" onClick={() => confirm("Kembalikan semua pengaturan ke bawaan?") && resetSettings()}>Reset</button></Row>
      </Group>
    </>
  );
}

const PAGES = [
  ["general", "Umum", "gear", General],
  ["island", "Island", "sparkle", IslandPage],
  ["widget", "Widget", "calendar", WidgetPage],
  ["dock", "Dock", "grid", DockPage],
  ["shortcuts", "Pintasan", "link", Shortcuts],
  ["privacy", "Privasi", "lock", Privacy],
  ["about", "Tentang", "info", About],
];

export default function Settings() {
  const s = useSettings();
  const [page, setPage] = useState("general");
  useEffect(() => { document.body.dataset.win = "settings"; }, []);
  const [, , , Page] = PAGES.find((p) => p[0] === page);
  const title = PAGES.find((p) => p[0] === page)[1];
  return (
    <div className="set">
      <nav className="sidenav">
        <div className="brand"><Icon name="sparkle" size={16} /> Dynamic Island</div>
        {PAGES.map(([k, n, ic]) => (
          <button key={k} type="button" data-on={page === k ? "1" : undefined} onClick={() => setPage(k)}>
            <Icon name={ic} size={16} />
            {n}
          </button>
        ))}
      </nav>
      <main className="smain" key={page}>
        <h1>{title}</h1>
        <Page s={s} />
      </main>
    </div>
  );
}
