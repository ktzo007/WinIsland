import { useRef } from "react";
import { Icon, IconButton } from "../../shared/Icon";
import { FileIcon } from "../../shared/ui";
import { dragOut } from "../../shared/tauri";
import { baseName } from "../../shared/format";

function Tile({ path, onRemove }) {
  const origin = useRef(null);
  return (
    <div
      className="tile"
      title={`${path}\nTarik ke aplikasi lain untuk menyalin`}
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.button === 0 && (origin.current = { x: e.clientX, y: e.clientY })}
      onMouseUp={() => (origin.current = null)}
      onMouseLeave={() => (origin.current = null)}
      onMouseMove={(e) => {
        const o = origin.current;
        // Drag native OLE baru dimulai setelah bergeser >5px (klik biasa tidak memicu).
        if (o && e.buttons & 1 && Math.hypot(e.clientX - o.x, e.clientY - o.y) > 5) {
          origin.current = null;
          dragOut(path);
        }
      }}
    >
      <FileIcon path={path} size={40} />
      <span>{baseName(path)}</span>
      <button type="button" className="tx" aria-label="Hapus dari shelf" onMouseDown={(e) => e.stopPropagation()} onClick={(e) => { e.stopPropagation(); onRemove(path); }}>
        <Icon name="x" size={10} sw={3} />
      </button>
    </div>
  );
}

export default function ShelfPanel({ ctx }) {
  const { shelf, dragging } = ctx;
  if (shelf.files.length === 0) {
    return (
      <div className="panel">
        <div className={`drop ${dragging ? "on" : ""}`}>
          <Icon name="shelf" size={22} />
          <b>{dragging ? "Lepas untuk menyimpan" : "Seret file ke sini"}</b>
          <span>Simpan sementara, lalu tarik keluar ke chat atau folder</span>
        </div>
      </div>
    );
  }
  return (
    <div className={`panel shelf ${dragging ? "on" : ""}`}>
      <div className="tiles" onWheel={(e) => { e.stopPropagation(); e.currentTarget.scrollLeft += e.deltaY; }}>
        {shelf.files.map((p) => (
          <Tile key={p} path={p} onRemove={shelf.remove} />
        ))}
      </div>
      <IconButton name="trash" size={14} label="Kosongkan shelf" className="md" onClick={shelf.clear} />
    </div>
  );
}
