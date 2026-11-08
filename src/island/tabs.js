export const EXP_W = 388;
export const TAB_BAR_H = 40;

/** h = tinggi area konten panel (px logis). Ukuran kapsul = h + TAB_BAR_H. */
export const TABS = {
  media: { label: "Musik", icon: "music", h: 116 },
  system: { label: "Sistem", icon: "cpu", h: 128 },
  calendar: { label: "Kalender", icon: "calendar", h: 226 },
  clipboard: { label: "Clipboard", icon: "clipboard", h: 196 },
  shelf: { label: "Shelf", icon: "shelf", h: 124 },
  focus: { label: "Fokus", icon: "focus", h: 132 },
  controls: { label: "Kontrol", icon: "controls", h: 154 },
};

export const IDLE = { w: 184, h: 34 };
export const TOAST = { w: 316, h: 56 };

/** Spring untuk morph kapsul. Hanya dipakai untuk transform (layout projection). */
export const SPRING = { type: "spring", stiffness: 380, damping: 32, mass: 0.9 };
export const SPRING_ECO = { type: "tween", duration: 0.18, ease: "easeOut" };

export const sizeFor = (mode) => (mode === "idle" ? IDLE : mode === "toast" ? TOAST : { w: EXP_W, h: TABS[mode].h + TAB_BAR_H });
