import { useEffect, useRef, useState } from "react";
import { clamp, ext } from "./format";
import { getIcon } from "./tauri";
import { Icon } from "./Icon";

/** Cincin progres (SVG). Offset di-transisi lewat CSS. */
export function Ring({ value = 0, size = 16, stroke = 2.4, children, className = "" }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <span className={`ring ${className}`} style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,.12)" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="rgb(var(--accent-rgb))"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - clamp(value, 0, 1))}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: "stroke-dashoffset .9s linear" }}
        />
      </svg>
      {children && <span className="ring-in">{children}</span>}
    </span>
  );
}

/** Indikator "sedang memutar": 3 batang, animasi CSS transform saja. */
export function Eq() {
  return (
    <span className="eq" aria-hidden="true">
      {[0, 0.28, 0.12].map((d) => (
        <i key={d} style={{ animationDelay: `${d}s` }} />
      ))}
    </span>
  );
}

/** Slider horizontal (pointer capture). value 0..1. */
export function Slider({ value, onChange, label, className = "" }) {
  const ref = useRef(null);
  const set = (e) => {
    const r = ref.current.getBoundingClientRect();
    onChange(clamp((e.clientX - r.left) / r.width, 0, 1));
  };
  return (
    <div
      ref={ref}
      className={`slider ${className}`}
      role="slider"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(value * 100)}
      onClick={(e) => e.stopPropagation()}
      onPointerDown={(e) => {
        e.stopPropagation();
        e.currentTarget.setPointerCapture(e.pointerId);
        set(e);
      }}
      onPointerMove={(e) => e.buttons & 1 && set(e)}
    >
      <i style={{ transform: `scaleX(${value})` }} />
      <b style={{ left: `${value * 100}%` }} />
    </div>
  );
}

/** Sparkline area SVG dari deret 0..100. */
export function Sparkline({ data, className = "" }) {
  const n = 30;
  const pts = data.length ? data : [0];
  const pad = Array(Math.max(0, n - pts.length)).fill(pts[0]);
  const arr = [...pad, ...pts].slice(-n);
  const x = (i) => (i / (n - 1)) * 100;
  const y = (v) => 28 - (clamp(v, 0, 100) / 100) * 26 - 1;
  const line = arr.map((v, i) => `${i ? "L" : "M"}${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join("");
  return (
    <svg className={`spark ${className}`} viewBox="0 0 100 28" preserveAspectRatio="none" aria-hidden="true">
      <path d={`${line}L100 28L0 28Z`} fill="rgba(var(--accent-rgb),.16)" />
      <path d={line} fill="none" stroke="rgb(var(--accent-rgb))" strokeWidth="1.4" vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
    </svg>
  );
}

/** Ikon file/aplikasi asli dari Windows (data-URL PNG dari Rust), fallback badge ekstensi. */
export function FileIcon({ path, size = 36, radius }) {
  const [src, setSrc] = useState(null);
  useEffect(() => {
    let alive = true;
    setSrc(null);
    getIcon(path).then((r) => alive && setSrc(r));
    return () => {
      alive = false;
    };
  }, [path]);
  if (src) return <img className="ficon" src={src} width={size} height={size} alt="" draggable={false} style={{ borderRadius: radius }} />;
  return (
    <span className="ficon fallback" style={{ width: size, height: size, borderRadius: radius ?? size * 0.24, fontSize: Math.max(8, size * 0.26) }}>
      {ext(path)}
    </span>
  );
}

/** Visualizer berbasis peak audio nyata (levelRef) → batang `scaleY`. rAF hanya jalan saat dipasang. */
export function Visualizer({ levelRef, playing, perf, bars = 9 }) {
  const els = useRef([]);
  useEffect(() => {
    if (!playing) {
      els.current.forEach((el) => el && (el.style.transform = "scaleY(.14)"));
      return;
    }
    let raf = 0;
    let last = 0;
    const vals = Array(bars).fill(0.14);
    const frame = (ts) => {
      raf = requestAnimationFrame(frame);
      if (perf !== "ultra" && ts - last < 33) return; // 30 fps pada mode non-ultra
      last = ts;
      const lvl = levelRef.current;
      const live = lvl > 0.003;
      for (let i = 0; i < bars; i++) {
        const shape = 0.45 + 0.55 * Math.abs(Math.sin(ts / 420 + i * 1.7) * Math.cos(ts / 730 + i * 0.9));
        const target = live ? Math.min(1, lvl * 2.4 * shape + 0.08) : 0.2 + 0.18 * shape; // tanpa meter → animasi lembut
        vals[i] += (target - vals[i]) * 0.35;
        if (els.current[i]) els.current[i].style.transform = `scaleY(${vals[i].toFixed(3)})`;
      }
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [playing, perf, bars, levelRef]);
  return (
    <span className="viz" aria-hidden="true">
      {Array.from({ length: bars }, (_, i) => (
        <i key={i} ref={(el) => (els.current[i] = el)} />
      ))}
    </span>
  );
}

export function Empty({ icon, title, hint }) {
  return (
    <div className="empty">
      <Icon name={icon} size={20} />
      <b>{title}</b>
      {hint && <span>{hint}</span>}
    </div>
  );
}
