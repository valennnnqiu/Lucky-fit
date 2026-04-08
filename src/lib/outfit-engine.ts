import { isGarmentAllowed } from "./garment-catalog";
import type { Gender, Occasion, OutfitRecommendation, WeatherSnapshot } from "./types";

/** Rounds `roll` + monotonic slot counter so Try again shifts picks without changing first-run (roll 0) output. */
type PickCtx = { roll: number; slot: number };

/** Pick one occasion to drive base / bottom / shoes when several are selected. */
function pickPrimaryOccasion(occasions: Occasion[]): Occasion {
  const o = occasions.length > 0 ? occasions : (["office"] as Occasion[]);
  const priority: Occasion[] = [
    "meeting",
    "office",
    "school",
    "party",
    "networking",
    "rave",
    "gym",
    "brunch",
    "coffee",
    "casual-day",
  ];
  for (const p of priority) {
    if (o.includes(p)) return p;
  }
  return o[0];
}

function pickGarment(
  pool: readonly string[],
  gender: Gender,
  fallback: string,
  ctx: PickCtx,
): string {
  const allowed = pool.filter((id) => isGarmentAllowed(id, gender));
  if (allowed.length === 0) return fallback;
  const s = ctx.slot++;
  const idx =
    ctx.roll === 0
      ? 0
      : (((ctx.roll * 7919 + s * 31) >>> 0) % allowed.length);
  return allowed[idx];
}

/** Male never uses `femalePool`; non-binary uses `neutralPool` (no dresses/skirts/heels-only, etc.). */
function pickByGenderGroup(
  gender: Gender,
  malePool: readonly string[],
  femalePool: readonly string[],
  neutralPool: readonly string[],
  fallback: string,
  ctx: PickCtx,
): string {
  if (gender === "male") return pickGarment(malePool, gender, fallback, ctx);
  if (gender === "non-binary") return pickGarment(neutralPool, gender, fallback, ctx);
  return pickGarment(femalePool, gender, fallback, ctx);
}

function shouldUseOnePiece(occasion: Occasion, gender: Gender, feelsLike: number): boolean {
  if (gender === "female") {
    if (occasion === "party" || occasion === "networking") return true;
    if (occasion === "brunch" && feelsLike >= 18) return true;
    return false;
  }
  if (gender === "male") {
    return occasion === "rave";
  }
  if (gender === "non-binary") {
    if (occasion === "rave") return true;
    if (occasion === "casual-day" && feelsLike >= 20) return true;
    return false;
  }
  return false;
}

function pickOnePieceGarment(
  occasion: Occasion,
  gender: Gender,
  feelsLike: number,
  ctx: PickCtx,
): string {
  if (gender === "female") {
    if (occasion === "party" || occasion === "networking") {
      return pickGarment(
        ["mini dress", "bodycon", "slip dress", "romper", "dress"],
        gender,
        "mini dress",
        ctx,
      );
    }
    if (occasion === "brunch") {
      return pickGarment(["maxi dress", "mini dress", "romper"], gender, "maxi dress", ctx);
    }
  }
  if (gender === "male" && occasion === "rave") {
    return pickGarment(["jumpsuit"], gender, "jumpsuit", ctx);
  }
  if (gender === "non-binary") {
    return pickGarment(["jumpsuit"], gender, "jumpsuit", ctx);
  }
  return pickGarment(["jumpsuit"], gender, "jumpsuit", ctx);
}

function midLayerByFeelsLike(feelsLike: number, gender: Gender, ctx: PickCtx): string | undefined {
  if (feelsLike <= 8) {
    return pickGarment(["sweater", "knit"], gender, "sweater", ctx);
  }
  if (feelsLike <= 16) {
    return pickGarment(["cardigan", "sweatshirt", "hoodie"], gender, "cardigan", ctx);
  }
  return undefined;
}

function outerLayerByWeather(
  weather: WeatherSnapshot,
  gender: Gender,
  ctx: PickCtx,
): string | undefined {
  const rainy = weather.condition === "rain" || weather.precipitation >= 0.3;
  if (rainy) {
    return pickGarment(["raincoat", "trench", "windbreaker", "jacket"], gender, "jacket", ctx);
  }
  if (weather.feelsLike <= 8) {
    return pickGarment(["coat", "puffer", "bomber"], gender, "coat", ctx);
  }
  if (weather.feelsLike <= 16) {
    return pickGarment(["blazer", "denim jacket", "leather jacket", "jacket"], gender, "blazer", ctx);
  }
  return undefined;
}

function baseBottomShoesForOccasion(
  occasion: Occasion,
  gender: Gender,
  ctx: PickCtx,
): { base: string; bottom: string; shoes: string } {
  switch (occasion) {
    case "meeting":
    case "office":
      return {
        base: pickByGenderGroup(
          gender,
          ["shirt buttondown", "henley", "polo", "tshirt"],
          ["blouse", "shirt buttondown", "polo"],
          ["shirt buttondown", "polo", "tshirt"],
          "shirt buttondown",
          ctx,
        ),
        bottom: pickByGenderGroup(
          gender,
          ["trousers", "pants"],
          ["trousers", "pants", "skirt midi"],
          ["trousers", "pants", "jeans"],
          "trousers",
          ctx,
        ),
        shoes: pickByGenderGroup(
          gender,
          ["oxfords", "loafers", "sneakers"],
          ["loafers", "flats", "sneakers"],
          ["loafers", "sneakers", "sandals"],
          "loafers",
          ctx,
        ),
      };
    case "gym":
      return {
        base: pickGarment(["tshirt", "tank", "henley"], gender, "tshirt", ctx),
        bottom: pickGarment(["shorts", "leggings", "sweatpants"], gender, "shorts", ctx),
        shoes: pickGarment(["sneakers"], gender, "sneakers", ctx),
      };
    case "party":
    case "networking":
      return {
        base: pickByGenderGroup(
          gender,
          ["shirt buttondown", "henley", "polo", "tshirt"],
          ["crop top", "tube", "blouse", "shirt buttondown"],
          ["shirt buttondown", "polo", "tshirt"],
          "shirt buttondown",
          ctx,
        ),
        bottom: pickByGenderGroup(
          gender,
          ["jeans", "trousers", "cargo"],
          ["jeans", "skirt mini", "trousers"],
          ["jeans", "trousers", "cargo"],
          "jeans",
          ctx,
        ),
        shoes: pickByGenderGroup(
          gender,
          ["boots", "oxfords", "loafers", "sneakers"],
          ["heels", "boots", "sandals"],
          ["boots", "loafers", "sneakers", "sandals"],
          "boots",
          ctx,
        ),
      };
    case "brunch":
    case "coffee":
    case "casual-day":
      return {
        base: pickGarment(["tshirt", "tank", "polo", "henley"], gender, "tshirt", ctx),
        bottom: pickByGenderGroup(
          gender,
          ["jeans", "shorts", "cargo"],
          ["jeans", "shorts", "skirt midi", "leggings"],
          ["jeans", "shorts", "cargo", "leggings"],
          "jeans",
          ctx,
        ),
        shoes: pickGarment(["sneakers", "sandals", "loafers"], gender, "sneakers", ctx),
      };
    case "rave":
      return {
        base: pickGarment(["hoodie", "sweatshirt", "tshirt"], gender, "hoodie", ctx),
        bottom: pickGarment(["jeans", "cargo", "leggings"], gender, "jeans", ctx),
        shoes: pickGarment(["boots", "sneakers"], gender, "boots", ctx),
      };
    case "school":
      return {
        base: pickGarment(["tshirt", "sweatshirt", "polo", "henley"], gender, "tshirt", ctx),
        bottom: pickGarment(["jeans", "trousers", "shorts"], gender, "jeans", ctx),
        shoes: pickGarment(["sneakers", "loafers"], gender, "sneakers", ctx),
      };
    default:
      return {
        base: pickGarment(["tshirt", "polo"], gender, "tshirt", ctx),
        bottom: pickGarment(["jeans", "trousers"], gender, "jeans", ctx),
        shoes: pickGarment(["sneakers"], gender, "sneakers", ctx),
      };
  }
}

function rainSafeShoes(shoes: string, gender: Gender, ctx: PickCtx): string {
  if (shoes !== "sneakers" && shoes !== "oxfords") return shoes;
  return pickGarment(["boots", "loafers"], gender, "boots", ctx);
}

const rainyGuardFootwear = new Set(["sneakers", "oxfords"]);

function isRainyWeather(weather: WeatherSnapshot): boolean {
  return weather.condition === "rain" || weather.precipitation >= 0.3;
}

const reminders = {
  rain: "Rain? Skip white shoes; take an umbrella.",
  snow: "Snow: stay warm; wear grippy shoes.",
  swing: "Big temp swing—add a warm layer.",
} as const;

export function generateOutfit(
  weather: WeatherSnapshot,
  occasions: Occasion[],
  luckyColor: string,
  gender: Gender,
  /** Increment to vary picks; `0` matches pre–Try-again behavior (first legal item per pool). */
  roll = 0,
): OutfitRecommendation {
  const ctx: PickCtx = { roll, slot: 0 };
  const list = occasions.length > 0 ? occasions : (["office"] as Occasion[]);
  const primary = pickPrimaryOccasion(list);
  const reminderList: string[] = [];

  if (isRainyWeather(weather)) {
    reminderList.push(reminders.rain);
  }
  if (weather.condition === "snow") {
    reminderList.push(reminders.snow);
  }
  if (Math.abs(weather.temp - weather.feelsLike) >= 4 || weather.feelsLike <= 12) {
    reminderList.push(reminders.swing);
  }

  if (shouldUseOnePiece(primary, gender, weather.feelsLike)) {
    const piece = pickOnePieceGarment(primary, gender, weather.feelsLike, ctx);
    const shoeSource = baseBottomShoesForOccasion(primary, gender, ctx);
    let shoes = shoeSource.shoes;
    if (isRainyWeather(weather) && rainyGuardFootwear.has(shoes)) {
      shoes = rainSafeShoes(shoes, gender, ctx);
    }

    return {
      onePiece: true,
      topLayers: {
        base: piece,
        mid: undefined,
        outer: outerLayerByWeather(weather, gender, ctx),
      },
      bottom: "",
      shoes,
      accessoryColor: luckyColor,
      reminder: reminderList,
    };
  }

  const fit = baseBottomShoesForOccasion(primary, gender, ctx);
  const mid = midLayerByFeelsLike(weather.feelsLike, gender, ctx);
  const outer = outerLayerByWeather(weather, gender, ctx);

  let shoes = fit.shoes;
  if (isRainyWeather(weather) && rainyGuardFootwear.has(shoes)) {
    shoes = rainSafeShoes(shoes, gender, ctx);
  }

  return {
    onePiece: false,
    topLayers: { base: fit.base, mid, outer },
    bottom: fit.bottom,
    shoes,
    accessoryColor: luckyColor,
    reminder: reminderList,
  };
}
