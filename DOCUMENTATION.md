# FitLife 360 — Buyer Documentation

Welcome! This guide covers setup, customization, deployment, and the honesty
principles baked into the code. **Author: Gaurav.**

---

## 1. Quick start (5 minutes)

1. Unzip the package.
2. Open `index.html` in Chrome/Edge/Firefox — the app runs immediately.
3. For GPS + camera features, host the folder on any static host with HTTPS
   (Netlify Drop, Vercel, GitHub Pages, cPanel — all work; no server code needed).
4. Walk through the onboarding once to create your profile.

## 2. Project structure

```
fitlife-360-source/
├── index.html          # App shell, nav, script load order
├── css/
│   └── styles.css      # All styling, dark/light themes via CSS variables
├── js/
│   ├── storage.js      # localStorage layer (namespaced keys, export/import/wipe)
│   ├── data.js         # Indian food DB, exercise library, workout plans,
│   │                   # Mifflin-St Jeor calculator, CSV helpers
│   ├── charts.js       # Canvas rings / bar / line charts (no dependencies)
│   ├── app.js          # Router, onboarding, home, water, sleep, journal,
│   │                   # progress, profile, settings, reminders
│   ├── workouts.js     # Plans, exercise library UI, live session + timers
│   ├── nutrition.js    # Food diary, portion calc, custom foods, AI scanner
│   ├── run.js          # GPS tracking, Haversine math, Leaflet map, history
│   └── diet.js         # 7-day diet plan generator + grocery list
├── assets/
│   └── icon.svg        # App icon
├── README.md
├── DOCUMENTATION.md    # (this file)
└── CHANGELOG.md
```

**Load order matters** (`index.html` bottom): storage → data → charts → app → features.
Each file exposes one global (`Storage`, `DB`, `Charts`, `App`, `Workouts`, `Nutrition`, `Run`, `Diet`).

## 3. Customization

### Branding
- App name: search for `FitLife 360` in `index.html` (`<title>`) and `js/app.js`.
- Author credit: the footer string `Created by Gaurav` appears in `js/app.js`
  (home footer, profile footer). Keep or replace per your license terms.
- Colors: edit the CSS variables at the top of `css/styles.css`
  (`--green` is the accent; `--bg`/`--card`/`--text` drive both themes).

### Food database
Edit `DB.FOODS` in `js/data.js`. Each entry:

```js
{ id:'f_roti', name:'Roti / Chapati (whole wheat)',
  per:1, unit:'pc', pcWeightG:30,
  kcal:90, p:3, c:18, f:1, fiber:2.5,
  tags:['veg','vegan'] }
```

- `per` + `unit`: reference amount (`100/'g'`, `1/'pc'`, `1/'tbsp'`…).
- All values are **estimates** — the UI labels them as such. Keep it that way;
  never present database values as exact measurements.

### Exercises & plans
Edit `DB.EXERCISES` and `DB.PLANS` in `js/data.js`. Plans reference exercise
ids; the session runner reads `sets`/`reps`/`rest` from each exercise.

### Diet plan templates
Edit the `T` object in `js/diet.js` (per diet preference × meal × 7 days).
Budget filtering uses `BUDGET_TIER` (1 = cheapest). Day totals auto-scale to the
user's calorie target within ±10% via `scaleToTarget()`.

## 4. AI features (Gemini)

The food scanner and diet-plan "Enhance" call Google's Gemini API **directly from
the browser** using a key the *end user* pastes in Settings → AI features.

- Model: `gemini-2.0-flash` (update the model string in `js/nutrition.js` /
  `js/diet.js` if Google renames it).
- The key is stored in `localStorage` on the user's device only.
- **Without a key the scanner shows an honest "API key required" state.**
  The code never fabricates recognition results.
- If you want server-side key handling instead, route the `fetch()` calls in
  `runGeminiScan()` / `enhanceWithGemini()` through your own backend proxy.

## 5. GPS running

- Uses `navigator.geolocation.watchPosition` with `enableHighAccuracy`.
- Distance = sum of Haversine segments; segments implying > 40 km/h are
  discarded as GPS jumps; fixes worse than ±60 m are ignored.
- Paused time is excluded from duration and pace.
- Map: **Leaflet 1.9.4 + OpenStreetMap tiles via CDN** — free, no API key.
  If the CDN is unreachable, `ensureLeaflet()` fails gracefully and tracking
  stats continue to work (the UI says the map is unavailable).
- Routes are stored only when the user saves a run *and* keeps "Save route"
  checked; routes can be deleted per-run.
- **HTTPS is required** for geolocation (browser rule). On `file://` or plain
  HTTP the app shows an "unavailable" state with a manual-entry fallback.

## 6. Data & privacy model

- Storage keys are namespaced `fitlife360_*` in `localStorage`.
- Export: Settings → JSON backup. Import: same screen. Wipe: same screen
  (double-confirmed).
- No analytics, no cookies, no external requests except: Leaflet CDN (maps),
  OSM tiles (maps), Google Gemini API (only when the user scans food / enhances
  a diet plan with their own key).

## 7. Health-safety rules in the code

- `DB.calcTargets()`: weight-loss target = TDEE − 400, floored at **1500 kcal**;
  minors get an explicit "use with a parent/coach" note; no unsupervised
  weight-loss prescriptions.
- Every nutrition value is labeled **"est."** in the UI.
- Disclaimers: "Estimates only — not medical advice" on Profile and Diet Plan.
- No appearance scores, no body-shaming copy anywhere.

## 8. Deployment checklist

- [ ] Upload folder to static host with HTTPS.
- [ ] Open on a phone; complete onboarding.
- [ ] Log a meal, water, sleep, a workout set, a journal entry.
- [ ] Test GPS on an outdoor walk (or use manual entry).
- [ ] Test food scanner **with** and **without** an API key.
- [ ] Toggle dark/light theme; switch metric/imperial.
- [ ] Export JSON backup; delete-all-data; re-import.

## 9. Known limitations (be upfront with your users)

1. Data lives in the browser — clearing site data deletes it (JSON backup exists).
2. No cross-device sync (by design — no server).
3. GPS accuracy depends on the device; indoor tracking will be poor.
4. Food scanner quality depends on photo clarity + Gemini model behavior.
5. Notifications work only while the page is open (no service worker yet).

## 10. License (generic single-buyer)

Your purchase grants **one buyer** the right to use, modify and deploy this code
in personal or commercial projects. You may **not** redistribute or resell the
source code itself (as-is or lightly modified) on marketplaces or elsewhere.
The author credit (`Created by Gaurav`) may be kept or replaced in your builds.

---

*FitLife 360 v1.0.0 — Created by Gaurav.*
