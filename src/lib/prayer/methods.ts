export type MethodId =
  | "kemenag"
  | "mwl"
  | "isna"
  | "egypt"
  | "makkah"
  | "karachi"
  | "jakim"
  | "muis"
  | "diyanet"

export type Method = {
  id: MethodId
  name: string
  region: string
  /** Sun depression below the horizon for Fajr, in degrees. */
  fajr: number
  /** Degrees below the horizon, or minutes after Maghrib when `ishaMinutes` is set. */
  isha: number
  ishaMinutes?: number
  /** Minutes added to each time after calculation (ihtiyat). Sunrise subtracts it. */
  ihtiyat: number
  /** Minutes between Imsak and Fajr. */
  imsakMinutes: number
  /** Extra minutes after solar noon for Dhuhr, on top of ihtiyat. */
  dhuhrExtra?: number
}

export const METHODS: Record<MethodId, Method> = {
  kemenag: {
    id: "kemenag",
    name: "Kemenag RI",
    region: "Indonesia",
    fajr: 20,
    isha: 18,
    ihtiyat: 2,
    imsakMinutes: 10,
    dhuhrExtra: 1,
  },
  mwl: { id: "mwl", name: "Muslim World League", region: "Europe, Far East", fajr: 18, isha: 17, ihtiyat: 0, imsakMinutes: 10 },
  isna: { id: "isna", name: "ISNA", region: "North America", fajr: 15, isha: 15, ihtiyat: 0, imsakMinutes: 10 },
  egypt: { id: "egypt", name: "Egyptian General Authority", region: "Africa, Middle East", fajr: 19.5, isha: 17.5, ihtiyat: 0, imsakMinutes: 10 },
  makkah: { id: "makkah", name: "Umm al-Qura, Makkah", region: "Arabian Peninsula", fajr: 18.5, isha: 0, ishaMinutes: 90, ihtiyat: 0, imsakMinutes: 10 },
  karachi: { id: "karachi", name: "University of Islamic Sciences, Karachi", region: "Pakistan, India, Bangladesh", fajr: 18, isha: 18, ihtiyat: 0, imsakMinutes: 10 },
  jakim: { id: "jakim", name: "JAKIM", region: "Malaysia", fajr: 20, isha: 18, ihtiyat: 2, imsakMinutes: 10 },
  muis: { id: "muis", name: "MUIS", region: "Singapore", fajr: 20, isha: 18, ihtiyat: 2, imsakMinutes: 10 },
  diyanet: { id: "diyanet", name: "Diyanet", region: "Turkey", fajr: 18, isha: 17, ihtiyat: 0, imsakMinutes: 10 },
}

export const METHOD_IDS = Object.keys(METHODS) as MethodId[]

export function isMethodId(value: string): value is MethodId {
  return value in METHODS
}
