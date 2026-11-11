import { useEffect, useState } from "react"

/** Starts from the server's clock so SSR and hydration agree, then ticks on the second. */
export function useNow(initial: number) {
  const [now, setNow] = useState(initial)
  useEffect(() => {
    setNow(Date.now())
    let id: ReturnType<typeof setTimeout>
    const tick = () => {
      setNow(Date.now())
      id = setTimeout(tick, 1000 - (Date.now() % 1000))
    }
    id = setTimeout(tick, 1000 - (Date.now() % 1000))
    return () => clearTimeout(id)
  }, [])
  return now
}
