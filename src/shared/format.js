export const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

export const fmtTime = (ms) => {
  const t = Math.max(0, Math.ceil(ms / 1000));
  return `${String(Math.floor(t / 60)).padStart(2, "0")}:${String(t % 60).padStart(2, "0")}`;
};

/** m:ss untuk durasi lagu. */
export const fmtTrack = (ms) => {
  const t = Math.max(0, Math.floor(ms / 1000));
  return `${Math.floor(t / 60)}:${String(t % 60).padStart(2, "0")}`;
};

export const fmtClock = (d, h24) =>
  d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", hour12: !h24 }).replace(".", ":");

export const fmtUptime = (s) => {
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  return d ? `${d}h ${h}j` : h ? `${h}j ${m}m` : `${m}m`;
};

export const fmtMinutes = (m) => (m >= 60 ? `${Math.floor(m / 60)}j ${m % 60}m` : `${m}m`);

export const baseName = (p) => (p || "").split(/[\\/]/).pop();
export const stem = (p) => baseName(p).replace(/\.[^.]+$/, "");
export const ext = (p) => {
  const n = baseName(p);
  return n.includes(".") ? n.split(".").pop().slice(0, 4).toLowerCase() : "file";
};

export const dayKey = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

export const SOURCE_NAMES = { spotify: "Spotify", chrome: "Chrome", msedge: "Edge", firefox: "Firefox", vlc: "VLC", brave: "Brave", opera: "Opera", music: "Apple Music", youtube: "YouTube" };
export const prettySource = (s) => {
  const id = (s || "").toLowerCase().replace(/\.exe$/, "");
  for (const k of Object.keys(SOURCE_NAMES)) if (id.includes(k)) return SOURCE_NAMES[k];
  return (s || "").replace(/\.exe$/i, "").split("!")[0].split(".").pop();
};
