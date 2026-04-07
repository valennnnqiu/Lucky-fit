import type { Occasion } from "./types";

const moodEn: Record<Occasion, string> = {
  meeting: "meeting day",
  office: "office day",
  coffee: "date",
  networking: "networking",
  party: "party night",
  gym: "gym day",
  brunch: "brunch",
  "casual-day": "casual day",
  rave: "rave night",
  school: "school day",
};

export function occasionMoodLabel(occasion: Occasion): string {
  return moodEn[occasion];
}

export function occasionsMoodLabel(occasions: Occasion[]): string {
  const list = occasions.length > 0 ? occasions : (["office"] as Occasion[]);
  return list.map((o) => moodEn[o]).join(" · ");
}
