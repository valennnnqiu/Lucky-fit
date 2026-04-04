import type { Gender } from "./types";

/**
 * Canonical ids that have `public/result/garment-slots/<slug>.png`.
 * Generator + UI only use these — 48 items (no imageless recommendations).
 */
export const GARMENT_IMAGE_IDS = [
  // Tops — inner (7)
  "tshirt",
  "tank",
  "henley",
  "blouse",
  "shirt buttondown",
  "polo",
  "crop top",
  // Mid (5)
  "sweater",
  "knit",
  "cardigan",
  "hoodie",
  "sweatshirt",
  // One-piece (9) — no `bodysuit` (no asset)
  "off shoulder",
  "tube",
  "dress",
  "maxi dress",
  "mini dress",
  "bodycon",
  "slip dress",
  "jumpsuit",
  "romper",
  // Outer (10)
  "jacket",
  "coat",
  "blazer",
  "denim jacket",
  "leather jacket",
  "bomber",
  "puffer",
  "trench",
  "windbreaker",
  "raincoat",
  // Bottoms (10) — no `skirt long` (no asset)
  "jeans",
  "pants",
  "trousers",
  "cargo",
  "leggings",
  "sweatpants",
  "shorts",
  "skirt mini",
  "skirt midi",
  // Shoes (7) — no `slippers` (no asset)
  "sneakers",
  "boots",
  "heels",
  "sandals",
  "loafers",
  "oxfords",
  "flats",
] as const;

const GARMENT_IMAGE_SET = new Set<string>(GARMENT_IMAGE_IDS);

export function hasGarmentImage(id: string): boolean {
  return GARMENT_IMAGE_SET.has(id.trim());
}

/**
 * Gender rules — keys must be a subset of `GARMENT_IMAGE_IDS`.
 */
export const GARMENT_ELIGIBILITY: Record<string, readonly Gender[]> = {
  tshirt: ["female", "male", "non-binary"],
  tank: ["female", "male", "non-binary"],
  henley: ["male", "non-binary"],
  blouse: ["female", "non-binary"],
  "shirt buttondown": ["female", "male", "non-binary"],
  polo: ["female", "male", "non-binary"],
  "crop top": ["female", "non-binary"],
  sweater: ["female", "male", "non-binary"],
  knit: ["female", "male", "non-binary"],
  cardigan: ["female", "male", "non-binary"],
  hoodie: ["female", "male", "non-binary"],
  sweatshirt: ["female", "male", "non-binary"],
  "off shoulder": ["female", "non-binary"],
  tube: ["female", "non-binary"],
  dress: ["female", "non-binary"],
  "maxi dress": ["female", "non-binary"],
  "mini dress": ["female", "non-binary"],
  bodycon: ["female", "non-binary"],
  "slip dress": ["female", "non-binary"],
  jumpsuit: ["female", "male", "non-binary"],
  romper: ["female", "non-binary"],
  jacket: ["female", "male", "non-binary"],
  coat: ["female", "male", "non-binary"],
  blazer: ["female", "male", "non-binary"],
  "denim jacket": ["female", "male", "non-binary"],
  "leather jacket": ["female", "male", "non-binary"],
  bomber: ["female", "male", "non-binary"],
  puffer: ["female", "male", "non-binary"],
  trench: ["female", "male", "non-binary"],
  windbreaker: ["female", "male", "non-binary"],
  raincoat: ["female", "male", "non-binary"],
  jeans: ["female", "male", "non-binary"],
  pants: ["female", "male", "non-binary"],
  trousers: ["female", "male", "non-binary"],
  cargo: ["female", "male", "non-binary"],
  leggings: ["female", "male", "non-binary"],
  sweatpants: ["female", "male", "non-binary"],
  shorts: ["female", "male", "non-binary"],
  "skirt mini": ["female", "non-binary"],
  "skirt midi": ["female", "non-binary"],
  sneakers: ["female", "male", "non-binary"],
  boots: ["female", "male", "non-binary"],
  heels: ["female", "non-binary"],
  sandals: ["female", "male", "non-binary"],
  loafers: ["female", "male", "non-binary"],
  oxfords: ["male", "non-binary"],
  flats: ["female", "non-binary"],
} as const;

export function isGarmentAllowed(id: string, gender: Gender): boolean {
  if (!hasGarmentImage(id)) return false;
  const g = GARMENT_ELIGIBILITY[id];
  return Boolean(g?.includes(gender));
}

/**
 * Basename for PNGs in `public/result/garment-slots/` (e.g. `mini dress` → `mini-dress.png`).
 */
export function garmentIdToImageBasename(id: string): string {
  return id.trim().toLowerCase().replace(/\s+/g, "-");
}

/** Human-readable grouping (every item exists in `GARMENT_IMAGE_IDS`). */
export const GARMENT_CATALOG = {
  tops: {
    inner: ["tshirt", "tank", "henley", "blouse", "shirt buttondown", "polo", "crop top"],
    mid: ["sweater", "knit", "cardigan", "hoodie", "sweatshirt"],
    onePiece: [
      "off shoulder",
      "tube",
      "dress",
      "maxi dress",
      "mini dress",
      "bodycon",
      "slip dress",
      "jumpsuit",
      "romper",
    ],
    outer: [
      "jacket",
      "coat",
      "blazer",
      "denim jacket",
      "leather jacket",
      "bomber",
      "puffer",
      "trench",
      "windbreaker",
      "raincoat",
    ],
  },
  bottoms: [
    "jeans",
    "pants",
    "trousers",
    "cargo",
    "leggings",
    "sweatpants",
    "shorts",
    "skirt mini",
    "skirt midi",
  ],
  shoes: ["sneakers", "boots", "heels", "sandals", "loafers", "oxfords", "flats"],
} as const;
