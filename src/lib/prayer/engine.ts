import { METHODS, type MethodId } from "./methods"

export const PRAYER_KEYS = ["imsak", "fajr", "sunrise", "dhuha", "dhuhr", "asr", "maghrib", "isha"] as const
export type PrayerKey = (typeof PRAYER_KEYS)[number]
/** The five obligatory prayers, in order. */
export const FARD_KEYS = ["fajr", "dhuhr", "asr", "maghrib", "isha"] as const satisfies readonly PrayerKey[]

export type AsrSchool = "standard" | "hanafi"

export type PrayerInput = {
  /** Local calendar date, `YYYY-MM-DD`. */
  date: string
  lat: number
  lng: number
  /** Meters above sea level. Lowers sunrise and raises sunset slightly. */
  elevation?: number
  /** IANA time zone, like `Asia/Makassar`. */
  timezone: string
  method?: MethodId
  asr?: AsrSchool
}

/** Epoch milliseconds for each time. `null` when the sun never reaches that angle. */
export type PrayerEpochs = Record<PrayerKey, number | null>

const DEG = Math.PI / 180
const sin = (d: number) => Math.sin(d * DEG)
const cos = (d: number) => Math.cos(d * DEG)
const tan = (d: number) => Math.tan(d * DEG)
const asin = (x: number) => Math.asin(x) / DEG
const acos = (x: number) => Math.acos(x) / DEG
const atan2 = (y: number, x: number) => Math.atan2(y, x) / DEG
const acot = (x: number) => Math.atan(1 / x) / DEG
const fix = (a: number, b: number) => {
  const r = a - b * Math.floor(a / b)
  return r < 0 ? r + b : r
}

function julian(year: number, month: number, day: number) {
  if (month <= 2) {
    year -= 1
    month += 12
  }
  const a = Math.floor(year / 100)
  const b = 2 - a + Math.floor(a / 4)
  return Math.floor(365.25 * (year + 4716)) + Math.floor(30.6001 * (month + 1)) + day + b - 1524.5
}

/** Low-precision solar coordinates (good to about a minute between 1950 and 2050). */
function sunPosition(jd: number) {
  const d = jd - 2451545.0
  const g = fix(357.529 + 0.98560028 * d, 360)
  const q = fix(280.459 + 0.98564736 * d, 360)
  const l = fix(q + 1.915 * sin(g) + 0.02 * sin(2 * g), 360)
  const e = 23.439 - 0.00000036 * d
  const ra = fix(atan2(cos(e) * sin(l), cos(l)) / 15, 24)
  return { declination: asin(sin(e) * sin(l)), equation: q / 15 - ra }
}

export function parseDate(date: string) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date)
  if (!m) return null
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])]
  const check = new Date(Date.UTC(y, mo - 1, d))
  if (check.getUTCMonth() !== mo - 1 || check.getUTCDate() !== d) return null
  return { y, mo, d }
}

/**
 * Computes prayer times for one local date. Pure function, no I/O.
 * Times are solved in local mean time (hours), then turned into UTC epochs.
 */
export function computePrayerEpochs(input: PrayerInput): PrayerEpochs {
  const parsed = parseDate(input.date)
  if (!parsed) throw new Error(`Invalid date: ${input.date}`)
  const { y, mo, d } = parsed
  const { lat, lng } = input
  const method = METHODS[input.method ?? "kemenag"]
  const asrFactor = input.asr === "hanafi" ? 2 : 1
  const elevation = Math.max(0, input.elevation ?? 0)
  const jDate = julian(y, mo, d) - lng / (15 * 24)

  const midDay = (t: number) => fix(12 - sunPosition(jDate + t / 24).equation, 24)
  // `angle` is degrees below the horizon; negative means above it.
  const sunAngleTime = (angle: number, t: number, morning: boolean) => {
    const decl = sunPosition(jDate + t / 24).declination
    const noon = midDay(t)
    const c = (-sin(angle) - sin(decl) * sin(lat)) / (cos(decl) * cos(lat))
    if (c < -1 || c > 1) return Number.NaN
    const span = acos(c) / 15
    return noon + (morning ? -span : span)
  }
  const asrTime = (t: number) => {
    const decl = sunPosition(jDate + t / 24).declination
    return sunAngleTime(-acot(asrFactor + tan(Math.abs(lat - decl))), t, false)
  }

  const riseSet = 0.833 + 0.0347 * Math.sqrt(elevation)
  let t = { fajr: 5, sunrise: 6, dhuha: 7, dhuhr: 12, asr: 13, maghrib: 18, isha: 18 }
  for (let i = 0; i < 2; i++) {
    t = {
      fajr: sunAngleTime(method.fajr, t.fajr, true),
      sunrise: sunAngleTime(riseSet, t.sunrise, true),
      dhuha: sunAngleTime(-4.5, t.dhuha, true),
      dhuhr: midDay(t.dhuhr),
      asr: asrTime(t.asr),
      maghrib: sunAngleTime(riseSet, t.maghrib, false),
      isha: method.ishaMinutes ? Number.NaN : sunAngleTime(method.isha, t.isha, false),
    }
  }
  if (method.ishaMinutes) t.isha = t.maghrib + method.ishaMinutes / 60

  // High latitudes: when twilight never ends, fall back to the angle-based night portion.
  const night = 24 - (t.maghrib - t.sunrise)
  if (Number.isFinite(night)) {
    const fajrLimit = t.sunrise - (method.fajr / 60) * night
    if (!Number.isFinite(t.fajr) || t.fajr < fajrLimit) t.fajr = fajrLimit
    if (!method.ishaMinutes) {
      const ishaLimit = t.maghrib + (method.isha / 60) * night
      if (!Number.isFinite(t.isha) || t.isha > ishaLimit) t.isha = ishaLimit
    }
  }

  const base = Date.UTC(y, mo - 1, d)
  const toEpoch = (hours: number, offsetMin: number, round: "up" | "down" | "nearest") => {
    if (!Number.isFinite(hours)) return null
    const ms = base + (hours - lng / 15) * 3_600_000 + offsetMin * 60_000
    const minutes = ms / 60_000
    const r = round === "up" ? Math.ceil(minutes) : round === "down" ? Math.floor(minutes) : Math.round(minutes)
    return r * 60_000
  }
  const ih = method.ihtiyat
  const careful = ih > 0
  const up = careful ? "up" : "nearest"
  const fajr = toEpoch(t.fajr, ih, up)
  return {
    imsak: fajr === null ? null : fajr - method.imsakMinutes * 60_000,
    fajr,
    sunrise: toEpoch(t.sunrise, -ih, careful ? "down" : "nearest"),
    dhuha: toEpoch(t.dhuha, ih, up),
    dhuhr: toEpoch(t.dhuhr, ih + (method.dhuhrExtra ?? 0), up),
    asr: toEpoch(t.asr, ih, up),
    maghrib: toEpoch(t.maghrib, ih, up),
    isha: toEpoch(t.isha, ih, up),
  }
}
