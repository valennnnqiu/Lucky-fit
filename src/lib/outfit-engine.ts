import { isGarmentAllowed } from "./garment-catalog";
import type { Gender, Occasion, OutfitRecommendation, WeatherSnapshot } from "./types";

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

function pickGarment(pool: readonly string[], gender: Gender, fallback: string): string {
  const hit = pool.find((id) => isGarmentAllowed(id, gender));
  return hit ?? fallback;
}

/** Male never uses `femalePool`; non-binary uses `neutralPool` (no dresses/skirts/heels-only, etc.). */
function pickByGenderGroup(
  gender: Gender,
  malePool: readonly string[],
  femalePool: readonly string[],
  neutralPool: readonly string[],
  fallback: string,
): string {
  if (gender === "male") return pickGarment(malePool, gender, fallback);
  if (gender === "non-binary") return pickGarment(neutralPool, gender, fallback);
  return pickGarment(femalePool, gender, fallback);
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

function pickOnePieceGarment(occasion: Occasion, gender: Gender, feelsLike: number): string {
  if (gender === "female") {
    if (occasion === "party" || occasion === "networking") {
      return pickGarment(
        ["mini dress", "bodycon", "slip dress", "romper", "dress"],
        gender,
        "mini dress",
      );
    }
    if (occasion === "brunch") {
      return pickGarment(["maxi dress", "mini dress", "romper"], gender, "maxi dress");
    }
  }
  if (gender === "male" && occasion === "rave") {
    return pickGarment(["jumpsuit"], gender, "jumpsuit");
  }
  if (gender === "non-binary") {
    return pickGarment(["jumpsuit"], gender, "jumpsuit");
  }
  return pickGarment(["jumpsuit"], gender, "jumpsuit");
}

function midLayerByFeelsLike(feelsLike: number, gender: Gender): string | undefined {
  if (feelsLike <= 8) {
    return pickGarment(["sweater", "knit"], gender, "sweater");
  }
  if (feelsLike <= 16) {
    return pickGarment(["cardigan", "sweatshirt", "hoodie"], gender, "cardigan");
  }
  return undefined;
}

function outerLayerByWeather(weather: WeatherSnapshot, gender: Gender): string | undefined {
  const rainy = weather.condition === "rain" || weather.precipitation >= 0.3;
  if (rainy) {
    return pickGarment(["raincoat", "trench", "windbreaker", "jacket"], gender, "jacket");
  }
  if (weather.feelsLike <= 8) {
    return pickGarment(["coat", "puffer", "bomber"], gender, "coat");
  }
  if (weather.feelsLike <= 16) {
    return pickGarment(["blazer", "denim jacket", "leather jacket", "jacket"], gender, "blazer");
  }
  return undefined;
}

function baseBottomShoesForOccasion(
  occasion: Occasion,
  gender: Gender,
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
        ),
        bottom: pickByGenderGroup(
          gender,
          ["trousers", "pants"],
          ["trousers", "pants", "skirt midi"],
          ["trousers", "pants", "jeans"],
          "trousers",
        ),
        shoes: pickByGenderGroup(
          gender,
          ["oxfords", "loafers", "sneakers"],
          ["loafers", "flats", "sneakers"],
          ["loafers", "sneakers", "sandals"],
          "loafers",
        ),
      };
    case "gym":
      return {
        base: pickGarment(["tshirt", "tank", "henley"], gender, "tshirt"),
        bottom: pickGarment(["shorts", "leggings", "sweatpants"], gender, "shorts"),
        shoes: pickGarment(["sneakers"], gender, "sneakers"),
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
        ),
        bottom: pickByGenderGroup(
          gender,
          ["jeans", "trousers", "cargo"],
          ["jeans", "skirt mini", "trousers"],
          ["jeans", "trousers", "cargo"],
          "jeans",
        ),
        shoes: pickByGenderGroup(
          gender,
          ["boots", "oxfords", "loafers", "sneakers"],
          ["heels", "boots", "sandals"],
          ["boots", "loafers", "sneakers", "sandals"],
          "boots",
        ),
      };
    case "brunch":
    case "coffee":
    case "casual-day":
      return {
        base: pickGarment(["tshirt", "tank", "polo", "henley"], gender, "tshirt"),
        bottom: pickByGenderGroup(
          gender,
          ["jeans", "shorts", "cargo"],
          ["jeans", "shorts", "skirt midi", "leggings"],
          ["jeans", "shorts", "cargo", "leggings"],
          "jeans",
        ),
        shoes: pickGarment(["sneakers", "sandals", "loafers"], gender, "sneakers"),
      };
    case "rave":
      return {
        base: pickGarment(["hoodie", "sweatshirt", "tshirt"], gender, "hoodie"),
        bottom: pickGarment(["jeans", "cargo", "leggings"], gender, "jeans"),
        shoes: pickGarment(["boots", "sneakers"], gender, "boots"),
      };
    case "school":
      return {
        base: pickGarment(["tshirt", "sweatshirt", "polo", "henley"], gender, "tshirt"),
        bottom: pickGarment(["jeans", "trousers", "shorts"], gender, "jeans"),
        shoes: pickGarment(["sneakers", "loafers"], gender, "sneakers"),
      };
    default:
      return {
        base: pickGarment(["tshirt", "polo"], gender, "tshirt"),
        bottom: pickGarment(["jeans", "trousers"], gender, "jeans"),
        shoes: pickGarment(["sneakers"], gender, "sneakers"),
      };
  }
}

function rainSafeShoes(shoes: string, gender: Gender): string {
  if (shoes !== "sneakers" && shoes !== "oxfords") return shoes;
  return pickGarment(["boots", "loafers"], gender, "boots");
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
): OutfitRecommendation {
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
    const piece = pickOnePieceGarment(primary, gender, weather.feelsLike);
    const shoeSource = baseBottomShoesForOccasion(primary, gender);
    let shoes = shoeSource.shoes;
    if (isRainyWeather(weather) && rainyGuardFootwear.has(shoes)) {
      shoes = rainSafeShoes(shoes, gender);
    }

    return {
      onePiece: true,
      topLayers: {
        base: piece,
        mid: undefined,
        outer: outerLayerByWeather(weather, gender),
      },
      bottom: "",
      shoes,
      accessoryColor: luckyColor,
      reminder: reminderList,
    };
  }

  const fit = baseBottomShoesForOccasion(primary, gender);
  const mid = midLayerByFeelsLike(weather.feelsLike, gender);
  const outer = outerLayerByWeather(weather, gender);

  let shoes = fit.shoes;
  if (isRainyWeather(weather) && rainyGuardFootwear.has(shoes)) {
    shoes = rainSafeShoes(shoes, gender);
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
