const pad = (n: number) => String(n).padStart(2, "0")

/** `1 jam 4 menit`, `12 menit`, `kurang dari 1 menit`. A no-break space keeps each number on its unit's line. */
export function untilText(seconds: number) {
  if (seconds < 60) return "kurang dari 1\u00a0menit"
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  if (h === 0) return `${m}\u00a0menit`
  return m === 0 ? `${h}\u00a0jam` : `${h}\u00a0jam ${m}\u00a0menit`
}

/** `1:04:09` or `04:09`. */
export function clock(seconds: number) {
  const s = Math.max(0, seconds)
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const r = s % 60
  return h > 0 ? `${h}:${pad(m)}:${pad(r)}` : `${pad(m)}:${pad(r)}`
}

const MONTHS = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"]

/** `11 November 2026` from `2026-11-11`. */
export function longDate(date: string) {
  const [y, m, d] = date.split("-").map(Number)
  return `${d} ${MONTHS[m - 1]} ${y}`
}

/** Hours since local midnight for an epoch, in a time zone. */
export function hoursInZone(ms: number, tz: string) {
  const parts = new Intl.DateTimeFormat("en-GB", { timeZone: tz, hour: "numeric", minute: "numeric", second: "numeric", hourCycle: "h23" }).formatToParts(ms)
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value ?? 0)
  return get("hour") + get("minute") / 60 + get("second") / 3600
}
