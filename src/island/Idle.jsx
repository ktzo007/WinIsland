import { Icon } from "../shared/Icon";
import { Eq, Ring } from "../shared/ui";
import { fmtClock, fmtTime, fmtTrack } from "../shared/format";

/** 184×34 — [status] [timer / judul lagu / jam] [privasi / baterai]. */
export default function Idle({ media, focus, privacy, power, now, s }) {
  let left = <span className="dot" />;
  if (focus.running) left = <Ring value={focus.progress} size={15} stroke={2.2} />;
  else if (media?.playing) left = <Eq />;

  let center = "";
  if (focus.running) center = focus.kind === "stopwatch" ? fmtTrack(focus.elapsed) : fmtTime(focus.left);
  else if (media) center = media.title;
  else if (s.island.showClock) center = fmtClock(now, s.island.clock24);

  const lowBat = power.hasBattery && !power.ac && power.percent != null && power.percent <= 20;
  return (
    <div className="idle">
      <div className="l">{left}</div>
      <div className={`c ${focus.running ? "num" : ""}`}>{center}</div>
      <div className="r">
        {privacy.cam && <i className="pdot cam" title="Kamera aktif" />}
        {privacy.mic && <i className="pdot mic" title="Mikrofon aktif" />}
        {!privacy.cam && !privacy.mic && power.hasBattery && (power.charging || lowBat) && (
          <Icon name={power.charging ? "boltF" : "battery"} size={13} className={power.charging ? "ok" : "bad"} />
        )}
      </div>
    </div>
  );
}
