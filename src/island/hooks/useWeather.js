import { useCallback, useEffect, useState } from "react";

export const WMO = {
  0: ["☀️", "Cerah"], 1: ["🌤️", "Cerah berawan"], 2: ["⛅", "Berawan"], 3: ["☁️", "Mendung"],
  45: ["🌫️", "Berkabut"], 48: ["🌫️", "Berkabut"], 51: ["🌦️", "Gerimis"], 53: ["🌦️", "Gerimis"], 55: ["🌧️", "Gerimis lebat"],
  61: ["🌧️", "Hujan ringan"], 63: ["🌧️", "Hujan"], 65: ["🌧️", "Hujan lebat"], 71: ["🌨️", "Salju"], 73: ["🌨️", "Salju"], 75: ["❄️", "Salju lebat"],
  80: ["🌦️", "Hujan lokal"], 81: ["🌧️", "Hujan lokal"], 82: ["⛈️", "Hujan deras"], 95: ["⛈️", "Badai petir"], 96: ["⛈️", "Badai petir"], 99: ["⛈️", "Badai petir"],
};

const TTL = 30 * 60_000;

/** Cuaca via Open-Meteo (tanpa API key). Opt-in; hanya fetch saat panel Kalender dibuka & cache 30 menit. */
export function useWeather(enabled, city, unit, active) {
  const [data, setData] = useState(null);
  const [state, setState] = useState("idle"); // idle | loading | error

  const load = useCallback(
    async (force = false) => {
      const name = city.trim();
      if (!enabled || !name) return;
      const ck = `di.weather.${name.toLowerCase()}.${unit}`;
      try {
        const cached = JSON.parse(localStorage.getItem(ck) || "null");
        if (cached && !force && Date.now() - cached.t < TTL) return setData(cached);
      } catch {}
      setState("loading");
      try {
        const g = await (await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(name)}&count=1&language=id&format=json`)).json();
        const loc = g.results?.[0];
        if (!loc) throw new Error("kota tidak ditemukan");
        const u = unit === "f" ? "fahrenheit" : "celsius";
        const w = await (
          await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${loc.latitude}&longitude=${loc.longitude}&current=temperature_2m,weather_code,is_day&daily=temperature_2m_max,temperature_2m_min&timezone=auto&temperature_unit=${u}`
          )
        ).json();
        const out = {
          t: Date.now(),
          place: loc.name,
          temp: Math.round(w.current.temperature_2m),
          code: w.current.weather_code,
          isDay: w.current.is_day === 1,
          hi: Math.round(w.daily.temperature_2m_max[0]),
          lo: Math.round(w.daily.temperature_2m_min[0]),
        };
        try {
          localStorage.setItem(ck, JSON.stringify(out));
        } catch {}
        setData(out);
        setState("idle");
      } catch {
        setState("error");
      }
    },
    [enabled, city, unit]
  );

  useEffect(() => {
    if (active) load();
  }, [active, load]);

  return { data, state, reload: () => load(true) };
}
