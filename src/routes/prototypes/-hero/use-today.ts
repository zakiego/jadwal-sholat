import { useMemo } from "react"
import { currentPrayer, dateIn, daySchedule, nextPrayer, type Place } from "@/lib/prayer/schedule"

export function useToday(place: Place, now: number) {
  const date = dateIn(now, place.timezone)
  const day = useMemo(() => daySchedule(place, date), [place, date])
  const minute = Math.floor(now / 60_000)
  const next = useMemo(() => nextPrayer(place, now), [place, minute])
  const current = useMemo(() => currentPrayer(place, now), [place, minute])
  const secondsLeft = next ? Math.max(0, Math.round((next.epoch - now) / 1000)) : 0
  return { day, next, current, secondsLeft }
}

export type VariantProps = {
  place: import("@/lib/prayer/schedule").Place
  now: number
  onCity: (slug: string) => void
}
