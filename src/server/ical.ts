import { FARD_KEYS, type PrayerKey } from "@/lib/prayer/engine"
import { addDays, daySchedule, LABELS_ID, type Options, type Place } from "@/lib/prayer/schedule"
import { SITE_HOST, SITE_URL } from "@/lib/site"

const stamp = (ms: number) => new Date(ms).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "")
const esc = (s: string) => s.replace(/[\\,;]/g, (c) => `\\${c}`)

/** An RFC 5545 feed with one 10-minute event per prayer, in UTC so every client agrees. */
export function buildIcs(place: Place, from: string, days: number, opts: Options, extra: { alarm: number | null; only?: string[] }) {
  const keys = (extra.only?.length ? extra.only.filter((k): k is PrayerKey => k in LABELS_ID) : [...FARD_KEYS]) as PrayerKey[]
  const now = stamp(Date.now())
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    `PRODID:-//${SITE_HOST}//Jadwal Sholat//ID`,
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:${esc(`Jadwal Sholat ${place.name}`)}`,
    `X-WR-TIMEZONE:${place.timezone}`,
    "REFRESH-INTERVAL;VALUE=DURATION:P1D",
    "X-PUBLISHED-TTL:P1D",
  ]
  for (let i = 0; i < days; i++) {
    const day = daySchedule(place, addDays(from, i), opts)
    for (const k of keys) {
      const at = day.epochs[k]
      if (at === null) continue
      lines.push(
        "BEGIN:VEVENT",
        `UID:${place.slug}-${day.date}-${k}@${SITE_HOST}`,
        `DTSTAMP:${now}`,
        `DTSTART:${stamp(at)}`,
        `DTEND:${stamp(at + 10 * 60_000)}`,
        `SUMMARY:${esc(`${LABELS_ID[k]} ${day.times[k]}`)}`,
        `LOCATION:${esc(place.name)}`,
        `URL:${SITE_URL}/${place.slug ?? ""}`,
        "TRANSP:TRANSPARENT",
      )
      if (extra.alarm !== null) {
        lines.push("BEGIN:VALARM", "ACTION:DISPLAY", `DESCRIPTION:${esc(`${LABELS_ID[k]} in ${extra.alarm} min`)}`, `TRIGGER:-PT${extra.alarm}M`, "END:VALARM")
      }
      lines.push("END:VEVENT")
    }
  }
  lines.push("END:VCALENDAR")
  // Lines over 75 octets must be folded; ours are short, so a plain CRLF join is enough.
  return lines.join("\r\n") + "\r\n"
}
