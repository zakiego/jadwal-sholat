import { createServerFn } from "@tanstack/react-start"
import { getRequest } from "@tanstack/react-start/server"
import { getCity } from "@/lib/cities"
import { placeFromCity } from "@/lib/prayer/schedule"
import { geoFromRequest, placeFromGeo } from "./resolve"

/** The place for a page: the city in the URL, or the visitor's city guessed from their IP. */
export const getPlace = createServerFn({ method: "GET" })
  .validator((d: { city?: string }) => d)
  .handler(({ data }) => {
    const now = Date.now()
    if (data.city) {
      const city = getCity(data.city)
      if (city) return { place: placeFromCity(city), source: "url" as const, now }
    }
    const { place, source } = placeFromGeo(geoFromRequest(getRequest()))
    return { place, source, now }
  })
