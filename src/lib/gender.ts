import type { Gender } from "./types";

export function normalizeGender(value: unknown): Gender {
  if (value === "female" || value === "male" || value === "non-binary") return value;
  return "non-binary";
}
