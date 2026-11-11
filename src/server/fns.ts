import { createServerFn } from "@tanstack/react-start"
import { getRequest } from "@tanstack/react-start/server"
import { CITIES, getCity } from "@/lib/cities"
import { placeFromCity } from "@/lib/prayer/schedule"
import { geoFromRequest, placeFromGeo } from "./resolve"

/** The visitor's city, guessed from their IP on the server so the page renders without a loading state. */
export const getHomePlace = createServerFn({ method: "GET" }).handler(() => {
  const { place, source } = placeFromGeo(geoFromRequest(getRequest()))
  return { place, source, now: Date.now() }
})

/** A city page: the place plus the other cities in the same province for internal links. */
export const getCityPage = createServerFn({ method: "GET" })
  .validator((d: { city: string }) => d)
  .handler(({ data }) => {
    const city = getCity(data.city)
    if (!city) return null
    const others = CITIES.filter((c) => c.province === city.province && c.slug !== city.slug)
      .sort((a, b) => a.name.localeCompare(b.name, "id"))
      .map((c) => ({ slug: c.slug, name: c.name }))
    return { place: placeFromCity(city), city: { slug: city.slug, name: city.name, province: city.province }, others, now: Date.now() }
  })
