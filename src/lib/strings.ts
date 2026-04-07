/** Static English copy (bilingual / locale switching removed). */

export function interpolate(
  template: string,
  vars: Record<string, string | number>,
): string {
  let s = template;
  for (const [k, v] of Object.entries(vars)) {
    s = s.replace(new RegExp(`\\{${k}\\}`, "g"), String(v));
  }
  return s;
}

export const strings = {
  skipToMain: "Skip to main content",
  header: {
    siteName: "Lucky Fit",
    logoAlt: "Lucky Fit logo placeholder",
    back: "Back",
  },
  home: {
    heroTitleLine1Lead: "Dress for the ",
    heroTitleLine1Accent: "weather",
    heroTitleLine1Trail: "",
    heroTitleLine2Lead: "Styled by your ",
    heroTitleLine2AccentLucky: "lucky",
    heroTitleLine2Mid: " ",
    heroTitleLine2AccentColor: "color",
    heroTitleLine2Trail: "",
    heroSubtitle: "",
    activityTitle: "What's your plan today?",
    cityLabel: "Your city",
    cityPlaceholder: "Search city",
    birthdayLabel: "Your birthday (for your lucky color 🎨)",
    birthdayPlaceholder: "YYYY-MM-DD",
    genderLabel: "Your identity",
    submit: "Let's go",
    submitBusy: "Loading…",
    activities: {
      office: "Office",
      coffee: "Date",
      gym: "Gym",
      party: "Party",
      brunch: "Brunch",
      meeting: "Meeting",
      school: "School",
    },
    gender: {
      female: "Female",
      male: "Male",
      nonBinary: "Non-binary",
    },
  },
  birthdayErrors: {
    year_invalid: "Enter a valid year (1900–2100).",
    month_invalid: "Enter a valid month (1–12).",
    day_invalid: "Enter a valid day (1–31).",
    date_invalid: "That date doesn’t exist for this month.",
    format_invalid: "Use a full date like YYYY-MM-DD (e.g. 2000-03-15).",
  },
  errors: {
    enterCity: "Enter your city.",
    enterBirthday: "Enter your birthday.",
    enterCityAndBirthday: "Enter your city and birthday.",
    occasionsRequired: "Pick at least one plan.",
    generic: "Something went wrong. Try again.",
    weather: "Could not load weather. Check your API key and city.",
  },
  result: {
    missing: "No outfit data. Start from the beginning.",
    backHome: "Home",
    weatherFeels: "Feels like",
    hiLo: "H: {high}° · L: {low}°",
    hiLoUnknown: "H:— · L:—",
    stayInformed: "Stay informed",
    luckyColor: "Lucky color",
    luckyFitBadge: "Lucky Fit",
    slotTop: "Top",
    slotOnePiece: "One Piece",
    slotBottom: "Bottom",
    slotShoes: "Shoes",
    downloadCta: "Download",
    downloadBusy: "Exporting…",
    madeBy: "Made by: {author}",
  },
  footer: {
    authorName: "Valen Qiu",
    tagline: "Made with AI & babo egg tarts",
    copyright: "© Valen Qiu. All rights reserved.",
    instagram: "Instagram",
    logoAlt: "Brand mark",
  },
} as const;
