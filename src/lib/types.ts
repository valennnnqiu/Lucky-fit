export type Gender = "female" | "male" | "non-binary";

/** OpenWeather Geocoding API 1.0 direct result item */
export interface GeoCitySuggestion {
  name: string;
  country: string;
  state?: string;
  lat: number;
  lon: number;
}

export type Occasion =
  | "meeting"
  | "office"
  | "coffee"
  | "networking"
  | "party"
  | "gym"
  | "brunch"
  | "casual-day"
  | "rave"
  | "school";

export type WeatherCondition = "clear" | "clouds" | "rain" | "snow" | "other";

export interface UserProfile {
  birthday: string;
  gender: Gender;
  city: string;
  luckyColor: string;
}

export interface WeatherSnapshot {
  city: string;
  temp: number;
  feelsLike: number;
  /** Daily min / max from OpenWeather `main` when available */
  tempMin?: number;
  tempMax?: number;
  precipitation: number;
  condition: WeatherCondition;
  description: string;
}

export interface OutfitRecommendation {
  /**
   * True when `topLayers.base` is a full one-piece look (dress, jumpsuit, etc.).
   * `bottom` is empty; separate bottom row is omitted on the result card.
   */
  onePiece?: boolean;
  topLayers: {
    base: string;
    mid?: string;
    outer?: string;
  };
  bottom: string;
  shoes: string;
  accessoryColor: string;
  reminder: string[];
}
