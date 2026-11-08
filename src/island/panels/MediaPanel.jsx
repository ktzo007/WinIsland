import { useEffect, useState } from "react";
import { Icon, IconButton } from "../../shared/Icon";
import { Slider, Visualizer, Empty } from "../../shared/ui";
import { clamp, fmtTrack, prettySource } from "../../shared/format";

function useProgress(info) {
  const [, tick] = useState(0);
  useEffect(() => {
    if (!info?.playing) return;
    const id = setInterval(() => tick((n) => n + 1), 500);
    return () => clearInterval(id);
  }, [info?.playing]);
  if (!info || !info.durationMs) return { pos: 0, dur: 0 };
  const drift = info.playing && info.updatedMs > 0 ? Date.now() - info.updatedMs : 0;
  return { pos: clamp(info.positionMs + drift, 0, info.durationMs), dur: info.durationMs };
}

export default function MediaPanel({ ctx }) {
  const { media, art, audio, s } = ctx;
  const info = media.info;
  const perf = s.general.perf;
  const { pos, dur } = useProgress(info);
  const meterOn = !!info?.playing && perf !== "eco";

  // Peak meter hanya hidup selama panel ini terbuka & lagu diputar.
  useEffect(() => {
    if (!meterOn) return;
    audio.meter(true);
    return () => audio.meter(false);
  }, [meterOn]); // eslint-disable-line

  if (!info) {
    return (
      <div className="panel">
        <Empty icon="music" title="Tidak ada musik" hint="Putar lagu di Spotify, YouTube, atau VLC" />
      </div>
    );
  }

  return (
    <div className="panel media">
      <div className="art" title={prettySource(info.source)}>
        {art ? <img src={art} alt="" draggable={false} /> : <Icon name="music" size={26} />}
      </div>
      <div className="meta">
        <div className="r1">
          <b className="title">{info.title || "Tanpa judul"}</b>
          <Visualizer levelRef={audio.levelRef} playing={!!info.playing && perf !== "eco"} perf={perf} />
        </div>
        <div className="artist">
          {info.artist || info.album || "—"}
          <i> · {prettySource(info.source)}</i>
        </div>
        {dur > 0 ? (
          <div className="prog">
            <span className="num">{fmtTrack(pos)}</span>
            <div
              className="bar"
              role="slider"
              aria-label="Posisi lagu"
              onClick={(e) => {
                e.stopPropagation();
                const r = e.currentTarget.getBoundingClientRect();
                media.seek(clamp((e.clientX - r.left) / r.width, 0, 1) * dur);
              }}
            >
              <i style={{ transform: `scaleX(${pos / dur})` }} />
            </div>
            <span className="num">-{fmtTrack(dur - pos)}</span>
          </div>
        ) : (
          <div className="prog live">Siaran langsung</div>
        )}
        <div className="ctl">
          <IconButton name="prev" size={16} label="Sebelumnya" disabled={!info.canPrev} onClick={() => media.control("prev")} className="md" />
          <IconButton name={info.playing ? "pause" : "play"} size={19} label={info.playing ? "Jeda" : "Putar"} onClick={() => media.control("play_pause")} className="lg solid" />
          <IconButton name="next" size={16} label="Berikutnya" disabled={!info.canNext} onClick={() => media.control("next")} className="md" />
          <span className="grow" />
          <IconButton name={audio.muted || audio.volume === 0 ? "mute" : audio.volume < 0.4 ? "volumeLow" : "volume"} size={15} label="Bisukan" onClick={audio.toggleMute} className="sm" />
          <Slider value={audio.muted ? 0 : audio.volume} onChange={audio.setVolume} label="Volume" className="vol" />
        </div>
      </div>
    </div>
  );
}
