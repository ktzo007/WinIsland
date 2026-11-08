import { useEffect, useMemo, useRef, useState } from "react";
import { Icon, IconButton } from "../../shared/Icon";
import { dayKey } from "../../shared/format";
import { call } from "../../shared/tauri";
import { WMO } from "../hooks/useWeather";

const MONTHS = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
const DAYS = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];
const DAY_LETTER = ["M", "S", "S", "R", "K", "J", "S"];

export default function CalendarPanel({ ctx }) {
  const { agenda, weather, s, now, setEditing } = ctx;
  const first = s.widgets.firstDay;
  const today = dayKey(now);
  const [view, setView] = useState(() => new Date(now.getFullYear(), now.getMonth(), 1));
  const [sel, setSel] = useState(today);
  const [adding, setAdding] = useState(false);
  const [time, setTime] = useState("");
  const [text, setText] = useState("");

  const cells = useMemo(() => {
    const start = new Date(view.getFullYear(), view.getMonth(), 1);
    const offset = (start.getDay() - first + 7) % 7;
    return Array.from({ length: 42 }, (_, i) => new Date(start.getFullYear(), start.getMonth(), 1 - offset + i));
  }, [view, first]);

  const selDate = new Date(sel + "T00:00:00");
  const list = agenda.forDay(sel);
  const w = weather.data;
  const [emoji, label] = w ? WMO[w.code] || ["🌡️", ""] : [];

  // Fokus keyboard sementara: NOACTIVATE dilepas hanya selama mengetik (idempoten + dibersihkan saat unmount).
  const focused = useRef(false);
  const focusOn = (on) => {
    if (focused.current === on) return;
    focused.current = on;
    setEditing(on);
    call("island_focus", { on });
  };
  useEffect(() => () => {
    if (focused.current) {
      focused.current = false;
      setEditing(false);
      call("island_focus", { on: false });
    }
  }, []); // eslint-disable-line
  const save = () => {
    if (text.trim()) agenda.add(sel, time, text.trim());
    setText("");
    setTime("");
    setAdding(false);
    focusOn(false);
  };

  return (
    <div className="panel cal">
      <div className="mon">
        <div className="mh">
          <b>
            {MONTHS[view.getMonth()]} <i>{view.getFullYear()}</i>
          </b>
          <span>
            <IconButton name="chevL" size={14} label="Bulan sebelumnya" className="sm" onClick={() => setView(new Date(view.getFullYear(), view.getMonth() - 1, 1))} />
            <IconButton name="chevR" size={14} label="Bulan berikutnya" className="sm" onClick={() => setView(new Date(view.getFullYear(), view.getMonth() + 1, 1))} />
          </span>
        </div>
        <div className="grid wk">
          {Array.from({ length: 7 }, (_, i) => (
            <span key={i}>{DAY_LETTER[(first + i) % 7]}</span>
          ))}
        </div>
        <div className="grid days">
          {cells.map((d) => {
            const k = dayKey(d);
            const out = d.getMonth() !== view.getMonth();
            return (
              <button key={k} type="button" className="day" data-out={out ? "1" : undefined} data-today={k === today ? "1" : undefined} data-sel={k === sel ? "1" : undefined} onClick={(e) => { e.stopPropagation(); setSel(k); }}>
                {d.getDate()}
                {agenda.hasDay(k) && <u />}
              </button>
            );
          })}
        </div>
      </div>

      <div className="agenda">
        <div className="ah">
          <b>{`${DAYS[selDate.getDay()]}, ${selDate.getDate()} ${MONTHS[selDate.getMonth()].slice(0, 3)}`}</b>
          {sel === today && <em>Hari ini</em>}
        </div>
        {s.widgets.weatherOn && (
          <div className="wx" onClick={(e) => { e.stopPropagation(); weather.reload(); }} title="Muat ulang cuaca">
            {w ? (
              <>
                <span className="we">{emoji}</span>
                <span className="wt num">{w.temp}°</span>
                <span className="wd">
                  {label}
                  <i>
                    {w.place} · {w.lo}°/{w.hi}°
                  </i>
                </span>
              </>
            ) : (
              <span className="wd">{weather.state === "error" ? "Cuaca gagal dimuat" : s.widgets.weatherCity ? "Memuat cuaca…" : "Isi kota di Pengaturan"}</span>
            )}
          </div>
        )}
        <div className="alist">
          {list.length === 0 && !adding && <div className="none">Tidak ada acara</div>}
          {list.map((e) => (
            <div key={e.id} className="ev">
              <span className="et num">{e.time || "—"}</span>
              <span className="etx">{e.text}</span>
              <button type="button" className="ex" aria-label="Hapus acara" onClick={(x) => { x.stopPropagation(); agenda.remove(e.id); }}>
                <Icon name="x" size={11} />
              </button>
            </div>
          ))}
        </div>
        {adding ? (
          <div className="addrow" onClick={(e) => e.stopPropagation()} onBlur={() => setTimeout(() => { if (!document.activeElement?.closest?.(".addrow")) focusOn(false); }, 60)}>
            <input type="time" value={time} onChange={(e) => setTime(e.target.value)} onFocus={() => focusOn(true)} />
            <input type="text" placeholder="Acara baru…" value={text} maxLength={60} autoFocus onChange={(e) => setText(e.target.value)} onFocus={() => focusOn(true)} onKeyDown={(e) => { if (e.key === "Enter") save(); if (e.key === "Escape") { setAdding(false); focusOn(false); } }} />
            <IconButton name="check" size={14} label="Simpan" className="sm solid" onClick={save} />
          </div>
        ) : (
          <button type="button" className="addbtn" onClick={(e) => { e.stopPropagation(); setAdding(true); focusOn(true); }}>
            <Icon name="plus" size={13} /> Tambah acara
          </button>
        )}
      </div>
    </div>
  );
}
