/**
 * Parses the many ways a human (or an old Excel sheet) writes a duration
 * into whole minutes. Returns null if nothing usable was found.
 *
 * Accepts: "80", "80 min", "80m", "1h 20m", "1h20", "1:20", "PT1H20M".
 */
export function parseDurationMinutes(input: unknown): number | null {
  if (input === null || input === undefined || input === "") return null;
  if (typeof input === "number" && Number.isFinite(input)) {
    return input >= 0 ? Math.round(input) : null;
  }

  const raw = String(input).trim();
  if (!raw) return null;

  // Plain number: "80"
  if (/^\d+(\.\d+)?$/.test(raw)) {
    return Math.round(Number(raw));
  }

  // ISO 8601 duration: "PT1H20M"
  const iso = raw.match(/^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/i);
  if (iso && (iso[1] || iso[2] || iso[3])) {
    const h = Number(iso[1] ?? 0);
    const m = Number(iso[2] ?? 0);
    const s = Number(iso[3] ?? 0);
    return h * 60 + m + Math.round(s / 60);
  }

  // "1:20" -> 1h 20m
  const clock = raw.match(/^(\d+):(\d{1,2})$/);
  if (clock) {
    return Number(clock[1]) * 60 + Number(clock[2]);
  }

  // "1h 20m", "1 hr 20 min", "1h20", "90 min", "20m"
  let minutes = 0;
  let matched = false;
  const hourMatch = raw.match(/(\d+(?:\.\d+)?)\s*(?:h|hr|hrs|hour|hours)\b/i);
  if (hourMatch) {
    minutes += Number(hourMatch[1]) * 60;
    matched = true;
  }
  const minMatch = raw.match(/(\d+(?:\.\d+)?)\s*(?:m|min|mins|minute|minutes)\b/i);
  if (minMatch) {
    minutes += Number(minMatch[1]);
    matched = true;
  }
  if (matched) return Math.round(minutes);

  // "1h20" with no unit on the minutes part
  const compact = raw.match(/^(\d+)h(\d{1,2})$/i);
  if (compact) {
    return Number(compact[1]) * 60 + Number(compact[2]);
  }

  return null;
}

export function formatMinutes(minutes: number | null | undefined): string {
  if (minutes === null || minutes === undefined) return "";
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h} hr` : `${h} hr ${m} min`;
}
