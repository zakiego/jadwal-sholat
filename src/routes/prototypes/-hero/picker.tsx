import { useEffect, useLayoutEffect, useRef, useState } from "react"

const useIsoLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect

/** Harness chrome from prototype/PICKER.md. Not part of the design. */
export function Picker({ names, active, onChange }: { names: string[]; active: number; onChange: (i: number) => void }) {
  const nav = useRef<HTMLElement>(null)
  const items = useRef<(HTMLButtonElement | null)[]>([])
  const hl = useRef<HTMLSpanElement>(null)
  const [ready, setReady] = useState(false)

  const move = () => {
    const el = items.current[active]
    if (!el || !hl.current) return
    hl.current.style.width = `${el.offsetWidth}px`
    hl.current.style.transform = `translateX(${el.offsetLeft}px)`
  }
  useIsoLayoutEffect(move, [active])
  useEffect(() => {
    const id = requestAnimationFrame(() => requestAnimationFrame(() => setReady(true)))
    window.addEventListener("resize", move)
    return () => {
      cancelAnimationFrame(id)
      window.removeEventListener("resize", move)
    }
  })
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement
      if (/^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName) || t.isContentEditable) return
      if (e.metaKey || e.ctrlKey || e.altKey) return
      const n = Number.parseInt(e.key, 10)
      if (n >= 1 && n <= names.length) onChange(n - 1)
      else if (e.key === "ArrowRight") onChange((active + 1) % names.length)
      else if (e.key === "ArrowLeft") onChange((active - 1 + names.length) % names.length)
    }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [active, names.length, onChange])

  return (
    <nav ref={nav} className="proto-picker" aria-label="Prototype variants" data-ready={ready ? "" : undefined}>
      <span ref={hl} className="proto-picker-highlight" aria-hidden="true" />
      {names.map((n, i) => (
        <button
          key={n}
          ref={(el) => {
            items.current[i] = el
          }}
          className="proto-picker-item"
          data-active={i === active ? "" : undefined}
          aria-current={i === active ? "true" : undefined}
          onClick={() => onChange(i)}
        >
          {n}
        </button>
      ))}
    </nav>
  )
}
