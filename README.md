## OOTD Oracle MVP

Daily outfit inspiration web app based on weather, occasion, and lucky color.

### Stack

- Next.js (App Router)
- React + Tailwind CSS
- Framer Motion
- OpenWeather API
- `html-to-image` (share card PNG export)

### Setup

Install dependencies and run the app:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

### Environment variables

Create a `.env.local` file in project root (see `.env.example`):

```bash
OPENWEATHER_API_KEY=your_openweather_key
```

Weather is fetched on the server via `/api/weather` so the key is not exposed to the browser. Without a key, the Oracle step shows an error until you configure one.

### Current routes (2 screens)

- `/` — input: activity (8 tags) + city + birthday + gender → fetches weather, generates outfit, goes to result
- `/result` — weather, tips, outfit card, download PNG

`/oracle` redirects to `/`. `/settings` redirects to `/`.

### Build check

```bash
npm run build
```
