"""Build src/data/cities.json from cahyadsn/wilayah (MIT) wilayah_level_1_2.sql."""
import json, re, sys, unicodedata

src, out = sys.argv[1], sys.argv[2]
row = re.compile(r"^\('([\d.]+)','([^']*)','([^']*)',\s*([-\d.]+),\s*([-\d.]+),\s*([-\d.]+),\s*(\d+),\s*([-\d.]+|NULL),\s*([-\d.]+|NULL),")
TZ = {7: "Asia/Jakarta", 8: "Asia/Makassar", 9: "Asia/Jayapura"}

def slugify(s):
    s = unicodedata.normalize("NFKD", s).encode("ascii", "ignore").decode().lower()
    return re.sub(r"[^a-z0-9]+", "-", s).strip("-")

provinces, regions = {}, []
for line in open(src, encoding="utf-8"):
    m = row.match(line)
    if not m:
        continue
    kode, nama, ibukota, lat, lng, elv, tz, _luas, pop = m.groups()
    nama = nama.replace("\\'", "'")
    if "." not in kode:
        provinces[kode] = nama
        continue
    is_city = nama.startswith("Kota ")
    short = re.sub(r"^(Kota Administrasi|Kabupaten Administrasi|Kota|Kabupaten)\s+", "", nama)
    slug = slugify(short) if is_city else "kab-" + slugify(short)
    regions.append({
        "id": kode, "slug": slug, "name": nama, "short": short,
        "type": "kota" if is_city else "kabupaten",
        "province": kode.split(".")[0],
        "capital": ibukota, "lat": round(float(lat), 5), "lng": round(float(lng), 5),
        "elevation": round(float(elv)), "tz": TZ[int(tz)],
        "population": int(float(pop)) if pop != "NULL" else None,
    })

for r in regions:
    r["province"] = provinces[r["province"]]
slugs = [r["slug"] for r in regions]
dupes = {s for s in slugs if slugs.count(s) > 1}
for r in regions:
    if r["slug"] in dupes:
        r["slug"] += "-" + slugify(r["province"])
assert len({r["slug"] for r in regions}) == len(regions)
regions.sort(key=lambda r: (-(r["population"] or 0)))
json.dump(regions, open(out, "w"), ensure_ascii=False, separators=(",", ":"))
print(len(provinces), "provinces,", len(regions), "regions, dupes:", sorted(dupes))
