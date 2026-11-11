# Jadwal Sholat design

## Contract

- Audience: Muslims in Indonesia checking today's prayer times, mostly on a phone, several times a day, often in a hurry. Second audience: developers who want a free prayer-time API or MCP server without signing up.
- Primary task: see the next prayer and how long until it, for my city, in under two seconds, without granting location permission.
- Category default: a dense monthly table on a green page with a mosque silhouette, gold Arabic calligraphy, geometric patterns and ad slots.
- Predictable opposite: a dark developer tool page with a code block as the hero.
- What this product does that neither shows: it knows your city from your connection and opens straight on the next prayer, and the same view is one `curl` away. The page shows the exact command that prints it.
- Required states: location guessed from IP (rendered on the server, no loading flash), city search with no match, after Isya the next prayer is tomorrow's Subuh, a long regency name (Kabupaten Kepulauan Siau Tagulandang Biaro), times that don't exist at high latitudes (null), 320px wide screens.
- Copy: Indonesian on the site, English in the API, MCP and developer docs. Headlines are one plain sentence.
- Type: Golos Text for everything on the site, JetBrains Mono for commands and code.
- One accent hue. Radius scale: shadcn `--radius` 0.625rem and its derived steps. No emoji in chrome, no decorative gradients, no mosque or calligraphy clip art.

## Decisions

- 2026-11-11, hero (today's times + next prayer): three variants. Day line (time as space: the day is one line and you're a dot on it, a vertical rail on phones), Poster (type scale: one huge serif word plus a countdown), Board (density: a dark departure board of eight equal tiles). Kept Day line. No reason given.
- 2026-11-11, type: dropped Instrument Sans (on the overused list) for Golos Text. Zaki: "anything, fix it". Tried Schibsted Grotesk first, but its tabular colon renders as "19 : 28".
