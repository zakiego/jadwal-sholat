import { useToday } from "@/hooks/use-today"
import { PRAYER_KEYS, type PrayerKey } from "@/lib/prayer/engine"
import { LABELS_ID, zoneAbbr, type Place } from "@/lib/prayer/schedule"
import { hoursInZone, longDate, untilText } from "@/lib/format"
import { cn } from "@/lib/utils"

/** The prayers drawn on the line. Imsak and Dhuha sit too close to their neighbours, so they get a line of text. */
const ON_LINE: PrayerKey[] = ["fajr", "sunrise", "dhuhr", "asr", "maghrib", "isha"]
const ABOVE: PrayerKey[] = ["sunrise"]

export function shortName(place: Place) {
  return place.name.replace(/^(Kota|Kabupaten) /, "").replace(/^Near /, "")
}

/** Today's prayers as one line with a "now" dot, standing up as a rail on narrow screens. */
export function DayLine({ place, now, eyebrow }: { place: Place; now: number; eyebrow?: React.ReactNode }) {
  const { day, next, current } = useToday(place, now)
  const tz = place.timezone
  const city = shortName(place)
  const zone = zoneAbbr(tz) ?? tz
  const hours = Object.fromEntries(
    PRAYER_KEYS.map((k) => [k, day.epochs[k] === null ? null : hoursInZone(day.epochs[k]!, tz)]),
  ) as Record<PrayerKey, number | null>
  const start = (hours.imsak ?? 4) - 0.5
  const end = (hours.isha ?? 20) + 1
  const pos = (h: number) => Math.min(1, Math.max(0, (h - start) / (end - start)))
  const nowH = hoursInZone(now, tz)
  const nowPos = pos(nowH)
  const nextIsToday = next?.date === day.date
  const isNext = (k: PrayerKey) => nextIsToday && next?.key === k
  const passed = (k: PrayerKey) => day.epochs[k] !== null && day.epochs[k]! <= now

  return (
    <section className="flex flex-col gap-10 sm:gap-14" aria-labelledby="today-heading">
      <div className="flex flex-col gap-3">
        <p className="text-sm text-muted-foreground">
          {eyebrow}
          {day.weekday}, {longDate(day.date)} · {day.hijri.text} · {zone}
        </p>
        <h1 id="today-heading" className="max-w-3xl text-[2.5rem] leading-[1.05] font-semibold tracking-[-0.025em] text-balance sm:text-6xl">
          {next ? (
            <>
              {next.name} di {city} {nextIsToday ? "" : "besok "}jam <span className="tabular-nums">{next.time}</span>,{" "}
              <span className="text-highlight">{untilText(next.in_seconds)} lagi.</span>
            </>
          ) : (
            <>Jadwal sholat {city} hari ini.</>
          )}
        </h1>
      </div>

      {/* Wide screens: the day as a horizontal line. */}
      <div className="relative hidden h-24 lg:block">
        <div className="absolute inset-x-0 top-8 h-px bg-border" aria-hidden="true" />
        <div className="absolute top-8 left-0 h-px origin-left bg-foreground" style={{ width: `${nowPos * 100}%` }} aria-hidden="true" />
        <ol aria-label={`Jadwal sholat ${city} hari ini`}>
          {ON_LINE.map((k) => {
            const h = hours[k]
            if (h === null) return null
            const above = ABOVE.includes(k)
            return (
              <li
                key={k}
                aria-current={isNext(k) ? "time" : undefined}
                className={cn(
                  "absolute top-0 flex w-20 -translate-x-1/2 flex-col items-center text-center",
                  passed(k) && !isNext(k) && "text-muted-foreground",
                )}
                style={{ left: `${pos(h) * 100}%` }}
              >
                <span className={cn("flex h-7 items-end pb-1 text-xs text-muted-foreground", !above && "invisible")} aria-hidden={!above}>
                  {LABELS_ID[k]}
                </span>
                <span
                  aria-hidden="true"
                  className={cn("size-2 rounded-full border bg-background", isNext(k) ? "border-highlight bg-highlight" : passed(k) ? "border-foreground bg-foreground" : "border-foreground/40")}
                />
                {!above && <span className={cn("mt-3 text-sm font-medium", isNext(k) && "text-highlight")}>{LABELS_ID[k]}</span>}
                <span className={cn("text-sm tabular-nums", above && "mt-3", isNext(k) ? "font-medium text-highlight" : "text-muted-foreground")}>
                  {day.times[k]}
                </span>
              </li>
            )
          })}
        </ol>
        <span
          aria-hidden="true"
          className="absolute top-8 size-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-highlight ring-4 ring-background"
          style={{ left: `${nowPos * 100}%` }}
        />
      </div>
      <p className="hidden gap-6 text-sm text-muted-foreground lg:flex">
        <span>
          Imsak <span className="text-foreground tabular-nums">{day.times.imsak}</span>
        </span>
        <span>
          Dhuha <span className="text-foreground tabular-nums">{day.times.dhuha}</span>
        </span>
      </p>

      {/* Narrow screens: the same line, standing up. */}
      <ol className="flex flex-col lg:hidden" aria-label={`Jadwal sholat ${city} hari ini`}>
        {PRAYER_KEYS.map((k, i) => {
          const done = passed(k)
          const nextUp = isNext(k)
          const lineDone = i < PRAYER_KEYS.length - 1 && passed(PRAYER_KEYS[i + 1])
          return (
            <li key={k} aria-current={nextUp ? "time" : undefined} className="relative flex items-center gap-4 py-2.5 pl-7">
              <span
                aria-hidden="true"
                className={cn("absolute top-1/2 left-[5px] h-full w-px", lineDone ? "bg-foreground" : "bg-border", i === PRAYER_KEYS.length - 1 && "hidden")}
              />
              <span
                aria-hidden="true"
                className={cn(
                  "absolute left-0 size-[11px] rounded-full border",
                  nextUp ? "border-highlight bg-highlight" : done ? "border-foreground bg-foreground" : "border-foreground/40 bg-background",
                )}
              />
              <span className={cn("w-20 text-base", nextUp ? "font-semibold text-highlight" : done && "text-muted-foreground")}>{LABELS_ID[k]}</span>
              <span className={cn("text-base tabular-nums", nextUp ? "font-semibold text-highlight" : done && "text-muted-foreground")}>{day.times[k] ?? "--:--"}</span>
              {k === current && !nextUp && <span className="text-xs text-muted-foreground">sekarang</span>}
            </li>
          )
        })}
      </ol>
      <span className="sr-only">Sekarang jam {hoursLabel(nowH)}.</span>
    </section>
  )
}

function hoursLabel(h: number) {
  const hh = Math.floor(h)
  const mm = Math.floor((h - hh) * 60)
  return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`
}
