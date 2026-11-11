import { useMemo } from "react"
import { currentPrayer, dateIn, daySchedule, nextPrayer, type Place } from "@/lib/prayer/schedule"

/** Today's schedule plus the next and current prayer, recomputed as the clock ticks. */
export function useToday(place: Place, now: number) {
  const date = dateIn(now, place.timezone)
  const day = useMemo(() => daySchedule(place, date), [place, date])
  const minute = Math.floor(now / 60_000)
  // biome-ignore lint: recompute once a minute, not every second
  const next = useMemo(() => nextPrayer(place, now), [place, minute])
  const current = useMemo(() => currentPrayer(place, now), [place, minute])
  return { day, next, current }
}
