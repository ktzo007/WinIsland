import { Icon, IconButton } from "../../shared/Icon";
import { Empty } from "../../shared/ui";

const kind = (t) => {
  if (/^https?:\/\/\S+$/i.test(t.trim())) return "link";
  if (/^[\d\s.,+\-:/]+$/.test(t.trim())) return "type";
  if (/[{};]|=>|<\/?\w+>|\bfunction\b|\bconst\b/.test(t) && t.includes("\n")) return "code";
  return "type";
};

export default function ClipboardPanel({ ctx }) {
  const { clip, s } = ctx;
  if (!s.clipboard.enabled) {
    return (
      <div className="panel">
        <Empty icon="clipboard" title="Riwayat clipboard dimatikan" hint="Aktifkan di Pengaturan → Privasi" />
      </div>
    );
  }
  return (
    <div className="panel clip">
      <div className="ch">
        <b>Riwayat salinan</b>
        <em>{clip.list.length} item · tidak disimpan ke disk</em>
        <span className="grow" />
        {clip.list.length > 0 && (
          <button type="button" className="ghost" onClick={(e) => { e.stopPropagation(); clip.clear(); }}>
            Hapus semua
          </button>
        )}
      </div>
      {clip.list.length === 0 ? (
        <Empty icon="clipboard" title="Belum ada salinan" hint="Salin teks (Ctrl+C) — muncul di sini" />
      ) : (
        <div className="clist" onWheel={(e) => e.stopPropagation()}>
          {clip.list.map((t) => (
            <div key={t} className="crow" data-pin={clip.pins.includes(t) ? "1" : undefined} title={t} onClick={(e) => { e.stopPropagation(); clip.paste(t); }}>
              <span className="ck">
                <Icon name={kind(t)} size={13} />
              </span>
              <span className="ct">{t.replace(/\s+/g, " ").trim()}</span>
              <span className="cact">
                <IconButton name="pin" size={12} label="Sematkan" active={clip.pins.includes(t)} className="xs" onClick={() => clip.togglePin(t)} />
                <IconButton name="copy" size={12} label="Salin saja" className="xs" onClick={() => clip.copy(t)} />
                <IconButton name="trash" size={12} label="Hapus" className="xs" onClick={() => clip.remove(t)} />
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
