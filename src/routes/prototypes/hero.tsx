import { useCallback } from "react"
import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { useNow } from "@/hooks/use-now"
import { getPlace } from "@/server/fns"
import pickerCss from "./-hero/picker.css?url"
import { Picker } from "./-hero/picker"
import { Board } from "./-hero/variant-board"
import { DayLine } from "./-hero/variant-dayline"
import { Poster } from "./-hero/variant-poster"

const VARIANTS = [
  { name: "Day line", Component: DayLine },
  { name: "Poster", Component: Poster },
  { name: "Board", Component: Board },
]

export const Route = createFileRoute("/prototypes/hero")({
  validateSearch: (s: Record<string, unknown>) => ({
    v: Number(s.v) >= 1 && Number(s.v) <= VARIANTS.length ? Number(s.v) : 1,
    city: typeof s.city === "string" ? s.city : undefined,
  }),
  loaderDeps: ({ search }) => ({ city: search.city }),
  loader: ({ deps }) => getPlace({ data: { city: deps.city } }),
  head: () => ({ meta: [{ title: "Prototype: hero" }, { name: "robots", content: "noindex" }], links: [{ rel: "stylesheet", href: pickerCss }] }),
  component: Harness,
})

function Harness() {
  const { place, now: serverNow } = Route.useLoaderData()
  const { v } = Route.useSearch()
  const navigate = useNavigate({ from: Route.fullPath })
  const now = useNow(serverNow)
  const active = v - 1
  const setActive = useCallback((i: number) => navigate({ search: (s) => ({ ...s, v: i + 1 }), replace: true }), [navigate])
  const onCity = useCallback((slug: string) => navigate({ search: (s) => ({ ...s, city: slug }) }), [navigate])
  const { Component } = VARIANTS[active]
  return (
    <>
      <div className="pb-20">
        <Component key={active} place={place} now={now} onCity={onCity} />
      </div>
      <Picker names={VARIANTS.map((x) => x.name)} active={active} onChange={setActive} />
    </>
  )
}
