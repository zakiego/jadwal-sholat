// Renders the OG images and icons into public/ at build time.
// Colors come from the :root tokens in src/styles.css, so the cards follow the theme.
import { mkdirSync, readFileSync, writeFileSync } from "node:fs"
import { Resvg } from "@resvg/resvg-js"
import satori from "satori"

const root = new URL("..", import.meta.url).pathname
const css = readFileSync(`${root}src/styles.css`, "utf8")
const cities = JSON.parse(readFileSync(`${root}src/data/cities.json`, "utf8"))
const fonts = [
  { name: "Golos", data: readFileSync(`${root}scripts/fonts/golos-400.ttf`), weight: 400, style: "normal" },
  { name: "Golos", data: readFileSync(`${root}scripts/fonts/golos-600.ttf`), weight: 600, style: "normal" },
]

/** oklch(L C H) -> #rrggbb, so satori (no oklch support) gets the same colors as the site. */
function oklchToHex(value) {
  const [l, c, h] = value.match(/oklch\(([^)]+)\)/)[1].trim().split(/\s+/).map(Number)
  const a = c * Math.cos((h * Math.PI) / 180)
  const b = c * Math.sin((h * Math.PI) / 180)
  const l_ = (l + 0.3963377774 * a + 0.2158037573 * b) ** 3
  const m_ = (l - 0.1055613458 * a - 0.0638541728 * b) ** 3
  const s_ = (l - 0.0894841775 * a - 1.291485548 * b) ** 3
  const lin = [
    4.0767416621 * l_ - 3.3077115913 * m_ + 0.2309699292 * s_,
    -1.2684380046 * l_ + 2.6097574011 * m_ - 0.3413193965 * s_,
    -0.0041960863 * l_ - 0.7034186147 * m_ + 1.707614701 * s_,
  ]
  const gamma = (x) => (x <= 0.0031308 ? 12.92 * x : 1.055 * x ** (1 / 2.4) - 0.055)
  return `#${lin.map((x) => Math.round(Math.min(1, Math.max(0, gamma(x))) * 255).toString(16).padStart(2, "0")).join("")}`
}
const rootBlock = css.match(/:root\s*{([^}]*)}/)[1]
const token = (name) => oklchToHex(rootBlock.match(new RegExp(`--${name}:\\s*(oklch\\([^)]+\\))`))[1])
const C = { bg: token("background"), fg: token("foreground"), muted: token("muted-foreground"), border: token("border"), accent: token("highlight") }

const h = (type, style, ...children) => ({ type, props: { style: { display: "flex", ...style }, children: children.flat() } })

// Rough positions of the six marks across a typical Indonesian day, for the drawing only.
const MARKS = [
  ["Subuh", 0.04],
  ["Terbit", 0.12],
  ["Dzuhur", 0.5],
  ["Ashar", 0.7],
  ["Maghrib", 0.88],
  ["Isya", 0.96],
]

function dayLine() {
  const W = 1080
  return h(
    "div",
    { position: "relative", width: W, height: 90 },
    h("div", { position: "absolute", left: 0, top: 20, width: W, height: 2, backgroundColor: C.border }),
    h("div", { position: "absolute", left: 0, top: 20, width: W * 0.8, height: 2, backgroundColor: C.fg }),
    ...MARKS.map(([name, p], i) =>
      h(
        "div",
        { position: "absolute", left: W * p - 50, top: 14, width: 100, flexDirection: "column", alignItems: "center" },
        h("div", {
          width: 14,
          height: 14,
          borderRadius: 999,
          backgroundColor: i === 5 ? C.accent : p < 0.8 ? C.fg : C.bg,
          border: `2px solid ${i === 5 ? C.accent : C.fg}`,
        }),
        h("div", { marginTop: 14, fontSize: 24, color: i === 5 ? C.accent : C.muted }, name),
      ),
    ),
    h("div", { position: "absolute", left: W * 0.8 - 14, top: 7, width: 28, height: 28, borderRadius: 999, backgroundColor: C.accent, border: `6px solid ${C.bg}` }),
  )
}

function card(title, line) {
  return h(
    "div",
    { width: 1200, height: 630, padding: 60, flexDirection: "column", justifyContent: "space-between", backgroundColor: C.bg, color: C.fg, fontFamily: "Golos" },
    h("div", { fontSize: 30, fontWeight: 600 }, "jadwal sholat"),
    h(
      "div",
      { flexDirection: "column" },
      h("div", { fontSize: title.length > 26 ? 64 : 80, fontWeight: 600, letterSpacing: -2, lineHeight: 1.05 }, title),
      h("div", { marginTop: 18, fontSize: 34, color: C.muted }, line),
    ),
    dayLine(),
    h("div", { fontSize: 28, color: C.muted }, "sholat.zakiego.com"),
  )
}

async function png(node, width, height) {
  const svg = await satori(node, { width, height, fonts })
  return new Resvg(svg, { fitTo: { mode: "width", value: width } }).render().asPng()
}

const out = `${root}public`
mkdirSync(`${out}/og`, { recursive: true })

// Icon: the product's own picture, a dot on the day line.
const iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="${C.fg}"/><rect x="10" y="31" width="44" height="3" rx="1.5" fill="${C.bg}" opacity="0.45"/><rect x="10" y="31" width="26" height="3" rx="1.5" fill="${C.bg}"/><circle cx="38" cy="32.5" r="8" fill="${C.accent}" stroke="${C.fg}" stroke-width="3"/></svg>`
writeFileSync(`${out}/favicon.svg`, iconSvg)
const render = (size) => new Resvg(iconSvg, { fitTo: { mode: "width", value: size } }).render().asPng()
writeFileSync(`${out}/apple-touch-icon.png`, render(180))
writeFileSync(`${out}/icon-192.png`, render(192))
writeFileSync(`${out}/icon-512.png`, render(512))
// favicon.ico holding one 32px PNG (ICO allows embedded PNG).
const p32 = render(32)
const ico = Buffer.alloc(22)
ico.writeUInt16LE(0, 0)
ico.writeUInt16LE(1, 2)
ico.writeUInt16LE(1, 4)
ico.writeUInt8(32, 6)
ico.writeUInt8(32, 7)
ico.writeUInt16LE(1, 10)
ico.writeUInt16LE(32, 12)
ico.writeUInt32LE(p32.length, 14)
ico.writeUInt32LE(22, 18)
writeFileSync(`${out}/favicon.ico`, Buffer.concat([ico, p32]))
writeFileSync(
  `${out}/manifest.webmanifest`,
  JSON.stringify(
    {
      name: "Jadwal Sholat",
      short_name: "Sholat",
      start_url: "/",
      display: "standalone",
      background_color: C.bg,
      theme_color: C.bg,
      icons: [
        { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
        { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      ],
    },
    null,
    2,
  ),
)

writeFileSync(`${out}/og/default.png`, await png(card("Jadwal sholat hari ini untuk kotamu", "514 kota dan kabupaten, metode Kemenag RI"), 1200, 630))
writeFileSync(`${out}/og/docs.png`, await png(card("Prayer times API and MCP server", "514 Indonesian cities and any coordinates. No key."), 1200, 630))
const only = process.argv[2]
let n = 0
for (const c of cities) {
  if (only && c.slug !== only) continue
  const name = c.type === "kota" ? c.short : `Kabupaten ${c.short}`
  writeFileSync(`${out}/og/${c.slug}.png`, await png(card(`Jadwal sholat ${name}`, `${c.province} · hari ini dan sebulan`), 1200, 630))
  n++
}
console.log(`og: ${n} city cards, default, docs, icons`)
