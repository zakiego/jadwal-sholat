import { useEffect, useState } from "react"

/** Events that mean the page is back in front of the user after being frozen or throttled. */
const RESUME_EVENTS = ["pageshow", "focus", "online"] as const

/** Starts from the server's clock so SSR and hydration agree, then ticks on the second. */
export function useNow(initial: number) {
  const [now, setNow] = useState(initial)
  useEffect(() => {
    let id: ReturnType<typeof setTimeout>
    const tick = () => {
      setNow(Date.now())
      id = setTimeout(tick, 1000 - (Date.now() % 1000))
    }
    // Background tabs throttle timers and mobile browsers freeze them, so restart the tick on resume.
    const resume = () => {
      if (document.visibilityState !== "visible") return
      clearTimeout(id)
      tick()
    }
    tick()
    for (const e of RESUME_EVENTS) window.addEventListener(e, resume)
    document.addEventListener("visibilitychange", resume)
    return () => {
      clearTimeout(id)
      for (const e of RESUME_EVENTS) window.removeEventListener(e, resume)
      document.removeEventListener("visibilitychange", resume)
    }
  }, [])
  return now
}
