import { IconButton } from "../../shared/Icon";
import { Ring } from "../../shared/ui";
import { fmtTime, fmtTrack } from "../../shared/format";

const KINDS = [
  ["pomodoro", "Pomodoro"],
  ["timer", "Timer"],
  ["stopwatch", "Stopwatch"],
];
const PRESETS = [5, 10, 15, 25, 45];

export default function FocusPanel({ ctx }) {
  const { focus } = ctx;
  const label =
    focus.kind === "stopwatch" ? "Berjalan" : focus.kind === "timer" ? "Hitung mundur" : focus.phase === "focus" ? "Fokus" : "Rehat";
  const big = focus.kind === "stopwatch" ? fmtTrack(focus.elapsed) : fmtTime(focus.left);
  return (
    <div className="panel focus">
      <Ring value={focus.progress} size={92} stroke={5} className="big">
        <span className="ft num">{big}</span>
        <span className="fl">{label}</span>
      </Ring>
      <div className="fr">
        <div className="seg">
          {KINDS.map(([k, n]) => (
            <button key={k} type="button" data-on={focus.kind === k ? "1" : undefined} onClick={(e) => { e.stopPropagation(); focus.setKind(k); }}>
              {n}
            </button>
          ))}
        </div>
        <div className="presets">
          {focus.kind === "timer" ? (
            PRESETS.map((m) => (
              <button key={m} type="button" className="chip" data-on={Math.round(focus.total / 60000) === m ? "1" : undefined} onClick={(e) => { e.stopPropagation(); focus.setTimer(m); }}>
                {m}m
              </button>
            ))
          ) : (
            <span className="hint">
              {focus.kind === "pomodoro" ? "25 menit fokus · 5 menit rehat (bisa diubah di Pengaturan)" : "Ukur durasi dengan akurat"}
            </span>
          )}
        </div>
        <div className="fbtn">
          <IconButton name={focus.running ? "pause" : "play"} size={18} label={focus.running ? "Jeda" : "Mulai"} className="lg solid" onClick={focus.toggle} />
          <IconButton name="reset" size={15} label="Atur ulang" className="md" onClick={focus.reset} />
        </div>
      </div>
    </div>
  );
}
