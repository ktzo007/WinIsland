import { Icon } from "../../shared/Icon";
import { Sparkline } from "../../shared/ui";
import { fmtMinutes, fmtUptime } from "../../shared/format";

function Mini({ icon, label, value, pct, hot, cls = "" }) {
  return (
    <div className={`mini ${cls}`}>
      <div className="mrow">
        <span className="ml">
          {icon && <Icon name={icon} size={11} />}
          {label}
        </span>
        <span className="mv num">{value}</span>
      </div>
      {pct != null && (
        <div className={`mbar ${hot ? "hot" : ""}`}>
          <i style={{ transform: `scaleX(${Math.min(100, pct) / 100})` }} />
        </div>
      )}
    </div>
  );
}

export default function SystemPanel({ ctx }) {
  const { stats, power } = ctx;
  const cur = stats.cur;
  const cpu = cur?.cpu != null ? Math.round(cur.cpu) : null;
  const batt = power.hasBattery;
  return (
    <div className="panel sys">
      <div className="card">
        <div className="clabel">CPU</div>
        <div className={`cbig num ${cpu >= 85 ? "hot" : ""}`}>{cpu != null ? cpu : "–"}<small>%</small></div>
        <Sparkline data={stats.cpu} />
      </div>
      <div className="card">
        <div className="clabel">RAM</div>
        <div className={`cbig num ${cur?.ramPercent >= 85 ? "hot" : ""}`}>{cur ? cur.ramPercent : "–"}<small>%</small></div>
        <Sparkline data={stats.ram} />
        <div className="csub num">{cur ? `${cur.ramUsedGb.toFixed(1)} / ${cur.ramTotalGb.toFixed(0)} GB` : ""}</div>
      </div>
      <div className="side">
        {batt ? (
          <Mini
            icon={power.charging ? "boltF" : "battery"}
            label={power.charging ? "Mengisi" : power.ac ? "Terhubung" : "Baterai"}
            value={power.percent != null ? `${power.percent}%` : "–"}
            pct={power.percent}
            hot={!power.ac && power.percent <= 20}
            cls={power.charging ? "ok" : ""}
          />
        ) : (
          <Mini icon="zap" label="Daya" value="AC" />
        )}
        <Mini icon="shelf" label="Disk" value={cur ? `${cur.diskPercent}%` : "–"} pct={cur?.diskPercent} hot={cur?.diskPercent >= 90} />
        <div className="mini foot num">
          {batt && !power.ac && power.minutesLeft != null ? `${fmtMinutes(power.minutesLeft)} tersisa · ` : ""}
          aktif {cur ? fmtUptime(cur.uptimeS) : "–"}
        </div>
      </div>
    </div>
  );
}
