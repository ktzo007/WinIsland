import { Icon, IconButton } from "../../shared/Icon";
import { FileIcon, Slider } from "../../shared/ui";
import { call } from "../../shared/tauri";
import { stem } from "../../shared/format";

function Tile({ icon, label, on, onClick }) {
  return (
    <button type="button" className="ctile" data-on={on ? "1" : undefined} onClick={(e) => { e.stopPropagation(); onClick(); }}>
      <span>
        <Icon name={icon} size={17} />
      </span>
      <em>{label}</em>
    </button>
  );
}

export default function ControlsPanel({ ctx }) {
  const { audio, s, keepAwake, setKeepAwake } = ctx;
  const vi = audio.muted || audio.volume === 0 ? "mute" : audio.volume < 0.4 ? "volumeLow" : "volume";
  return (
    <div className="panel ctrl">
      <div className="vrow">
        <IconButton name={vi} size={17} label="Bisukan" onClick={audio.toggleMute} className="md" />
        <Slider value={audio.muted ? 0 : audio.volume} onChange={audio.setVolume} label="Volume" className="wide" />
        <span className="num vp">{audio.muted ? "Mute" : Math.round(audio.volume * 100)}</span>
      </div>
      <div className="tiles6">
        <Tile icon="coffee" label="Terjaga" on={keepAwake} onClick={() => setKeepAwake(!keepAwake)} />
        <Tile icon="scissors" label="Tangkap" onClick={() => call("sys_action", { name: "screenshot" })} />
        <Tile icon="activity" label="Task Mgr" onClick={() => call("sys_action", { name: "taskmgr" })} />
        <Tile icon="lock" label="Kunci" onClick={() => call("sys_action", { name: "lock" })} />
        <Tile icon="gear" label="Pengaturan" onClick={() => call("open_settings_window")} />
        <Tile icon="eyeOff" label="Sembunyi" onClick={() => call("set_manual_hidden", { hidden: true })} />
      </div>
      <div className="srow" onWheel={(e) => { e.stopPropagation(); e.currentTarget.scrollLeft += e.deltaY; }}>
        {s.shortcuts.length === 0 && <span className="hint">Tambahkan pintasan aplikasi/situs di Pengaturan → Pintasan</span>}
        {s.shortcuts.map((x) => (
          <button key={x.path} type="button" className="sc" title={x.path} onClick={(e) => { e.stopPropagation(); call("launch", { path: x.path }); }}>
            {/^https?:/i.test(x.path) ? <Icon name="globe" size={16} /> : <FileIcon path={x.path} size={18} radius={5} />}
            <span>{x.name || stem(x.path)}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
