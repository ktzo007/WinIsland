import { Icon } from "../shared/Icon";
import { Eq, Ring } from "../shared/ui";

const volIcon = (v, m) => (m || v === 0 ? "mute" : v < 0.4 ? "volumeLow" : "volume");

/** Live activity 316×56: lagu berganti, volume, daya, privasi, timer, agenda. */
export default function Toast({ t, art, audio }) {
  switch (t.kind) {
    case "track":
      return (
        <div className="toast">
          <div className="t-art">{art ? <img src={art} alt="" draggable={false} /> : <Icon name="music" size={16} />}</div>
          <div className="t-txt">
            <b>{t.title}</b>
            <span>{t.artist}</span>
          </div>
          <Eq />
        </div>
      );
    case "volume":
      return (
        <div className="toast">
          <div className="t-ico">
            <Icon name={volIcon(audio.volume, audio.muted)} size={18} />
          </div>
          <div className="t-bar">
            <i style={{ transform: `scaleX(${audio.muted ? 0 : audio.volume})` }} />
          </div>
          <span className="t-val num">{audio.muted ? "Mute" : Math.round(audio.volume * 100)}</span>
        </div>
      );
    case "power":
      return (
        <div className="toast">
          <div className={`t-ico ${t.low ? "bad" : "ok"}`}>
            <Icon name={t.low ? "battery" : "boltF"} size={18} />
          </div>
          <div className="t-txt">
            <b>{t.title}</b>
            <span>{t.sub}</span>
          </div>
          {t.pct != null && <span className="t-val num">{t.pct}%</span>}
        </div>
      );
    case "privacy":
      return (
        <div className="toast">
          <div className={`t-ico ${t.mic && !t.cam ? "mic" : "cam"}`}>
            <Icon name={t.cam ? "camera" : "mic"} size={18} />
          </div>
          <div className="t-txt">
            <b>{t.cam && t.mic ? "Kamera & mikrofon aktif" : t.cam ? "Kamera sedang dipakai" : "Mikrofon sedang dipakai"}</b>
            <span>Oleh aplikasi di latar belakang</span>
          </div>
        </div>
      );
    case "focus":
      return (
        <div className="toast">
          <Ring value={1} size={30} stroke={3}>
            <Icon name="check" size={13} sw={3} />
          </Ring>
          <div className="t-txt">
            <b>{t.title}</b>
            <span>{t.sub}</span>
          </div>
        </div>
      );
    default:
      return (
        <div className="toast">
          <div className="t-ico">
            <Icon name={t.icon || "info"} size={18} />
          </div>
          <div className="t-txt">
            <b>{t.title}</b>
            {t.sub && <span>{t.sub}</span>}
          </div>
        </div>
      );
  }
}
