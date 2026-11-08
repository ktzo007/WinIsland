import { Icon, IconButton } from "../shared/Icon";
import { TABS } from "./tabs";
import { call } from "../shared/tauri";

const TAB_W = 36;

export default function TabBar({ tabs, tab, onTab, pinned, onPin, badges }) {
  const i = Math.max(0, tabs.indexOf(tab));
  return (
    <div className="tabbar" onClick={(e) => e.stopPropagation()}>
      <div className="tabs" style={{ width: tabs.length * TAB_W }}>
        <i className="ind" style={{ width: TAB_W, transform: `translateX(${i * TAB_W}px)` }} />
        {tabs.map((k) => (
          <button key={k} type="button" className="tab" data-on={k === tab ? "1" : undefined} title={TABS[k].label} aria-label={TABS[k].label} style={{ width: TAB_W }} onClick={() => onTab(k)}>
            <Icon name={TABS[k].icon} size={16} />
            {badges[k] && <u />}
          </button>
        ))}
      </div>
      <div className="tb-act">
        <IconButton name="pin" size={14} label={pinned ? "Lepas sematan" : "Sematkan terbuka"} active={pinned} onClick={onPin} className="sm" />
        <IconButton name="gear" size={14} label="Pengaturan" onClick={() => call("open_settings_window")} className="sm" />
      </div>
    </div>
  );
}
