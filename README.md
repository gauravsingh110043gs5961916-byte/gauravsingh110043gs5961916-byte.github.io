# FitLife 360 — Source Code

A complete, mobile-first **health & fitness web app** — pure HTML, CSS and JavaScript.
No build step. No framework. No server. Open it and it works.

**Created by Gaurav**

---

## ✨ Features

- **Onboarding + Profile** — name, age, height, weight, activity, goals, diet preference (veg / vegan / non-veg / eggetarian), allergies, equipment. BMR/TDEE via the **Mifflin-St Jeor** equation with safe calorie targets.
- **Home dashboard** — calorie / water / protein progress rings, today's activity strip, quick-add buttons, weekly calorie chart (canvas-drawn, zero dependencies).
- **Workout planner** — 24-exercise library with instructions, beginner / intermediate / advanced plans, home & gym filters, live workout timer + rest timer, start / pause / resume / finish, per-set logging, workout history.
- **Nutrition tracker** — food diary (breakfast / lunch / dinner / snacks), built-in **Indian food database** (~55 foods; all values clearly labeled as *estimates*), portion calculator (g, ml, pc, cup, bowl, tbsp, tsp), custom foods, repeat-yesterday, daily macro bars.
- **📸 AI Food Scanner** — camera / gallery upload with review-and-correct flow. **Requires the user's own free Gemini API key** (Settings → AI features). Shows an honest *"API key required"* state when missing — **never fabricates results**.
- **🏃 GPS Run tracker** — real `navigator.geolocation` tracking, Haversine distance, pace / speed math, pause excludes paused time, GPS-jump filtering, live route on a **free Leaflet + OpenStreetMap map** (graceful fallback if the map CDN is offline — stats still work), run history, route viewer, CSV export, running goals, manual entry fallback.
- **🥗 AI Diet Plan Generator** — honest rule-based 7-day Indian meal plan from the user's profile (goal, diet, calorie target, budget low/med/high). Editable per day, grocery-list generator, send-to-diary. Optional **Gemini enhance** when an API key is present.
- **Water tracker** — quick-add 150/250/500/750 ml + custom, progress ring, history, edit / delete, adjustable goal.
- **Sleep tracker** — bedtime / wake logging, auto duration, quality rating, weekly trends (labeled manual entry).
- **Progress analytics** — calories, protein, water, sleep, activity, weight charts with 7/14/30-day filters + full CSV export.
- **Health journal** — energy / mood / stress / soreness / private notes.
- **Reminders** — Notification API with permission request + in-app fallback.
- **Settings** — dark / light theme, metric / imperial units, JSON backup export / import, delete-all-data with confirmation, privacy info.
- **Privacy-first** — everything in `localStorage` on the user's device. Nothing uploaded anywhere.

## 🚀 How to run

**Option A — double-click:** open `index.html` in any modern browser. Everything works except GPS and camera (browsers block those on `file://`).

**Option B — any static host (recommended):** upload the folder to Netlify, Vercel, GitHub Pages, or any web host. GPS tracking and camera then work over **HTTPS**.

No `npm install`. No build. No database to configure.

## ⚙️ Configuration

| Feature | Needs | Where |
|---|---|---|
| AI Food Scanner | Free Gemini API key ([Google AI Studio](https://aistudio.google.com) → Get API Key) | Settings → AI features |
| AI Diet Enhance | Same key as above | Settings → AI features |
| GPS Run map | Nothing — Leaflet + OpenStreetMap via CDN, no key | automatic (stats work even if CDN is offline) |

**Browser requirements:** a modern browser (Chrome / Edge / Firefox / Safari, 2021+). GPS + camera require **HTTPS** (or `localhost`) — this is a browser security rule, not an app limitation.

## 🔒 License

This purchase includes a **single-buyer license**: you may use, modify and deploy this code for your own projects. Redistribution or resale of the source code *as-is* on marketplaces is not permitted. See `DOCUMENTATION.md` for the full buyer guide.

## 👤 Author

**Created by Gaurav** — FitLife 360.

## 🩺 Health disclaimer

All calorie, nutrition and fitness figures are **estimates for general wellness**, not medical advice. The app avoids extreme deficits, labels every estimate, and advises minors to use it with a parent or coach. Consult a qualified professional for personal health decisions.
