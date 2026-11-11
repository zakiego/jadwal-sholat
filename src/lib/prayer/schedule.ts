import type { City } from "@/lib/cities"
import { computePrayerEpochs, FARD_KEYS, PRAYER_KEYS, type AsrSchool, type PrayerKey } from "./engine"
import { METHODS, type MethodId } from "./methods"

export type Place = {
  name: string
  /** City slug when the place is one of the bundled cities. */
  slug: string | null
  province: string | null
  lat: number
  lng: number
  elevation: number
  timezone: string
}

export type Options = { method?: MethodId; asr?: AsrSchool }

export const LABELS_ID: Record<PrayerKey, string> = {
  imsak: "Imsak",
  fajr: "Subuh",
  sunrise: "Terbit",
  dhuha: "Dhuha",
  dhuhr: "Dzuhur",
  asr: "Ashar",
  maghrib: "Maghrib",
  isha: "Isya",
}

const HIJRI_MONTHS_ID = [
  "Muharram",
  "Safar",
  "Rabiul Awal",
  "Rabiul Akhir",
  "Jumadil Awal",
  "Jumadil Akhir",
  "Rajab",
  "Sya'ban",
  "Ramadhan",
  "Syawal",
  "Dzulqa'dah",
  "Dzulhijjah",
]

export function placeFromCity(c: City): Place {
  return { name: c.name, slug: c.slug, province: c.province, lat: c.lat, lng: c.lng, elevation: c.elevation, timezone: c.tz }
}

const fmtCache = new Map<string, Intl.DateTimeFormat>()
function fmt(tz: string, kind: "time" | "date" | "offset" | "weekday") {
  const key = `${tz}|${kind}`
  let f = fmtCache.get(key)
  if (!f) {
    const opts: Intl.DateTimeFormatOptions =
      kind === "time"
        ? { timeZone: tz, hour: "2-digit", minute: "2-digit", hourCycle: "h23" }
        : kind === "date"
          ? { timeZone: tz, year: "numeric", month: "2-digit", day: "2-digit" }
          : kind === "offset"
            ? { timeZone: tz, timeZoneName: "longOffset" }
            : { timeZone: tz, weekday: "long" }
    f = new Intl.DateTimeFormat(kind === "weekday" ? "id-ID" : "en-CA", opts)
    fmtCache.set(key, f)
  }
  return f
}

export const formatTime = (ms: number, tz: string) => fmt(tz, "time").format(ms)
/** `YYYY-MM-DD` of an instant in a time zone. */
export const dateIn = (ms: number, tz: string) => fmt(tz, "date").format(ms)

export function utcOffset(ms: number, tz: string) {
  const name = fmt(tz, "offset").formatToParts(ms).find((p) => p.type === "timeZoneName")?.value ?? "GMT"
  const m = /GMT([+-]\d{2}):?(\d{2})?/.exec(name)
  return m ? `${m[1]}:${m[2] ?? "00"}` : "+00:00"
}

export function isoInZone(ms: number, tz: string) {
  return `${dateIn(ms, tz)}T${formatTime(ms, tz)}:00${utcOffset(ms, tz)}`
}

export function zoneAbbr(tz: string) {
  return ({ "Asia/Jakarta": "WIB", "Asia/Makassar": "WITA", "Asia/Jayapura": "WIT" } as Record<string, string>)[tz] ?? null
}

export function hijri(date: string) {
  const [y, m, d] = date.split("-").map(Number)
  const parts = new Intl.DateTimeFormat("en-u-ca-islamic-umalqura-nu-latn", {
    timeZone: "UTC",
    year: "numeric",
    month: "numeric",
    day: "numeric",
  }).formatToParts(Date.UTC(y, m - 1, d, 12))
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value.replace(/\D/g, ""))
  const hy = get("year")
  const hm = get("month")
  const hd = get("day")
  return {
    date: `${hy}-${String(hm).padStart(2, "0")}-${String(hd).padStart(2, "0")}`,
    day: hd,
    month: hm,
    month_name: HIJRI_MONTHS_ID[hm - 1],
    year: hy,
    text: `${hd} ${HIJRI_MONTHS_ID[hm - 1]} ${hy} H`,
  }
}

export function addDays(date: string, n: number) {
  const [y, m, d] = date.split("-").map(Number)
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10)
}

export function methodInfo(opts: Options) {
  const m = METHODS[opts.method ?? "kemenag"]
  return { id: m.id, name: m.name, fajr_angle: m.fajr, isha_angle: m.ishaMinutes ? null : m.isha, isha_minutes: m.ishaMinutes ?? null, ihtiyat_minutes: m.ihtiyat, asr: opts.asr ?? "standard" }
}

export function placeJson(p: Place) {
  return {
    name: p.name,
    slug: p.slug,
    province: p.province,
    latitude: p.lat,
    longitude: p.lng,
    elevation: p.elevation,
    timezone: p.timezone,
    timezone_abbr: zoneAbbr(p.timezone),
  }
}

export function daySchedule(place: Place, date: string, opts: Options = {}) {
  const ep = computePrayerEpochs({ date, lat: place.lat, lng: place.lng, elevation: place.elevation, timezone: place.timezone, ...opts })
  const times = {} as Record<PrayerKey, string | null>
  const timestamps = {} as Record<PrayerKey, string | null>
  for (const k of PRAYER_KEYS) {
    const v = ep[k]
    times[k] = v === null ? null : formatTime(v, place.timezone)
    timestamps[k] = v === null ? null : isoInZone(v, place.timezone)
  }
  const noon = ep.dhuhr ?? Date.UTC(...(date.split("-").map(Number) as [number, number, number]))
  return {
    date,
    weekday: fmt(place.timezone, "weekday").format(noon),
    hijri: hijri(date),
    utc_offset: utcOffset(noon, place.timezone),
    times,
    timestamps,
    epochs: ep,
  }
}

export type DaySchedule = ReturnType<typeof daySchedule>

export function monthSchedule(place: Place, month: string, opts: Options = {}) {
  const [y, m] = month.split("-").map(Number)
  const days = new Date(Date.UTC(y, m, 0)).getUTCDate()
  return Array.from({ length: days }, (_, i) => daySchedule(place, `${month}-${String(i + 1).padStart(2, "0")}`, opts))
}

/** The next obligatory prayer after `now`, rolling into tomorrow after Isha. */
export function nextPrayer(place: Place, now: number, opts: Options = {}) {
  const today = dateIn(now, place.timezone)
  for (const date of [today, addDays(today, 1)]) {
    const day = daySchedule(place, date, opts)
    for (const k of FARD_KEYS) {
      const at = day.epochs[k]
      if (at !== null && at > now) {
        return { key: k, name: LABELS_ID[k], date, time: day.times[k]!, timestamp: day.timestamps[k]!, epoch: at, in_seconds: Math.round((at - now) / 1000) }
      }
    }
  }
  return null
}

export function currentPrayer(place: Place, now: number, opts: Options = {}) {
  const day = daySchedule(place, dateIn(now, place.timezone), opts)
  let cur: (typeof FARD_KEYS)[number] | null = null
  for (const k of FARD_KEYS) {
    const at = day.epochs[k]
    if (at !== null && at <= now) cur = k
  }
  return cur
}
