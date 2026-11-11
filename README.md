# Jadwal Sholat

Prayer times for every Indonesian city and regency (514 kabupaten/kota, Kemenag RI method) and any coordinates worldwide. Live at https://sholat.zakiego.com.

- Website: today's times as a day line with the next prayer, plus a monthly table per city
- JSON API under `/api/v1`, OpenAPI spec at `/openapi.json`
- MCP server at `/mcp` (stateless Streamable HTTP, no auth)
- iCal feeds at `/api/v1/calendar/{city}.ics`
- `curl sholat.zakiego.com/banjarbaru` prints today's times as text

Times are computed in the Worker (`src/lib/prayer/engine.ts`), no upstream API. `pnpm validate` compares them with the official Kemenag schedule from api.myquran.com. City coordinates come from [cahyadsn/wilayah](https://github.com/cahyadsn/wilayah) (MIT), rebuilt with `scripts/build-cities.py`.

## Develop

```bash
pnpm i
pnpm dev                # http://localhost:3000
pnpm og                 # render OG images, icons and manifest into public/
pnpm build && pnpm deploy
```

On a city page in dev, `?data=worst|after-isha|polar` swaps in worst-case data.

Deploys to the Zakiego Lab Cloudflare account:

```bash
XDG_CONFIG_HOME="$HOME/.wrangler-accounts/personal" pnpm deploy
```

## Layout

- `src/server.ts`: Worker entry. Routes `/api`, `/mcp`, robots, sitemap, `llms.txt` and the curl text view, then hands the rest to TanStack Start.
- `src/server/`: API handlers, MCP server, OpenAPI spec, iCal, text view.
- `src/lib/prayer/`: the calculation engine, methods and schedule helpers.
- `src/routes/`: `/`, `/$city`, `/docs`.
- `DESIGN.md`: design contract and decisions.
