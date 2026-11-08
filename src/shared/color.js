const cache = new Map();

/**
 * Warna dominan dari sampul (canvas 24×24, dibobot saturasi × kecerahan).
 * Hasil: { rgb: [r,g,b], accent: [r,g,b] } — accent dicerahkan agar terbaca di latar gelap.
 */
export function dominantColor(src) {
  if (!src) return Promise.resolve(null);
  if (cache.has(src)) return cache.get(src);
  const p = new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      try {
        const c = document.createElement("canvas");
        c.width = c.height = 24;
        const ctx = c.getContext("2d", { willReadFrequently: true });
        ctx.drawImage(img, 0, 0, 24, 24);
        const d = ctx.getImageData(0, 0, 24, 24).data;
        let r = 0, g = 0, b = 0, w = 0;
        for (let i = 0; i < d.length; i += 4) {
          if (d[i + 3] < 128) continue;
          const mx = Math.max(d[i], d[i + 1], d[i + 2]);
          const mn = Math.min(d[i], d[i + 1], d[i + 2]);
          const sat = mx === 0 ? 0 : (mx - mn) / mx;
          const wt = 0.15 + sat * sat * 2 + (mx > 40 && mx < 235 ? 0.4 : 0);
          r += d[i] * wt; g += d[i + 1] * wt; b += d[i + 2] * wt; w += wt;
        }
        if (!w) return resolve(null);
        const rgb = [r / w, g / w, b / w].map(Math.round);
        const lift = (v) => Math.round(v + (255 - v) * 0.35);
        resolve({ rgb, accent: rgb.map(lift) });
      } catch {
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
    img.src = src;
  });
  cache.set(src, p);
  return p;
}

export const hexToRgb = (hex) => {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex || "");
  if (!m) return null;
  const n = parseInt(m[1], 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
