# ABLEmaps

Traveling salesman route optimizer for pediatric clinic outreach in Metro Atlanta.

Import clinic lists from Google Maps shared links, optimize driving routes via the Held-Karp algorithm, and navigate with Google Maps or Apple Maps.

## Quick Start

```bash
npm install
npm run dev
```

Open `http://localhost:5173`, pick a region from the dropdown, and hit **Optimize Route**.

## Features

- **Import from Google Maps shared lists** — paste a `maps.app.goo.gl/...` link to pull in places dynamically (no Google Takeout needed). Backed by a Vite dev middleware that ports the gmaps-list parser to TypeScript.
- **7 pre-loaded Metro Atlanta regions** — Doraville/Chamblee/Tucker, ITP SE Atlanta, Johns Creek/Duluth/Lawrenceville, Marietta/Kennesaw, Roswell/Alpharetta, Sandy Springs/Dunwoody, West Metro
- **Held-Karp TSP solver** — exact optimal route for up to 15 stops
- **OSRM driving distances** — real road distance matrix via the open OSRM demo server
- **Interactive Leaflet map** — numbered amber stop markers, bold blue route polyline, auto-fits to route bounds
- **Stop management** — mark visited, add notes, reorder by optimized route
- **Deep links** — open the full multi-stop route in Google Maps (waypoints) or Apple Maps (waypoint params)
- **Google Takeout CSV import** — fallback for existing CSV exports with Nominatim geocoding
- **Collapsible sections** — Import Places and Route Controls auto-fold after route generation; expandable for subsequent runs
- **Step-by-step optimization status** — live status messages for matrix fetch, TSP solve, and route geometry

## Data Sources

The `maps/` directory contains clinic lists extracted from shared Google Maps lists using [gmaps-list](https://github.com/anupamchugh/gmaps-list). Each file is a JSON array of `{ name, latitude, longitude }`.

## Office Location

1875 Old Alabama Rd, Roswell, GA 30076 (hardcoded as the starting point for all routes).

## Tech Stack

| Layer | Choice |
|---|---|
| Frontend | React 19, TypeScript, Vite 8 |
| Map | Leaflet + react-leaflet |
| Routing | OSRM (open source, demo server) |
| TSP Solver | Held-Karp DP (exact, O(n²·2ⁿ)) |
| Geocoding | Nominatim (OSM) |
| Styling | Tailwind v4 |
| List Parsing | Custom TypeScript port of gmaps-list |

## Project Structure

```
ablemaps/
├── src/
│   ├── components/
│   │   ├── ImportPanel.tsx       # Region dropdown, URL paste, file upload
│   │   ├── MapView.tsx           # Leaflet map with markers + polyline
│   │   ├── ControlPanel.tsx      # Stop count slider + optimize button
│   │   ├── StopList.tsx          # Ordered stops + visited/notes/deep links
│   │   └── CollapsibleSection.tsx # Toggle accordion wrapper
│   ├── lib/
│   │   ├── tsp.ts                # Held-Karp DP solver
│   │   ├── geocode.ts            # Nominatim geocoding + localStorage cache
│   │   ├── osrm.ts               # OSRM distance matrix + route geometry
│   │   └── csv.ts                # PapaParse + Place ID extraction
│   ├── App.tsx                   # State wiring + optimization flow
│   ├── main.tsx
│   └── index.css
├── server/
│   └── parse-list.ts             # gmaps-list port (Vite middleware at /api/parse-list)
├── maps/                         # Pre-extracted clinic JSON files
├── public/maps/                  # Served copies of maps/
├── Want to go.csv                # Sample Google Takeout export
├── package.json
├── vite.config.ts
├── index.html
├── README.md
└── DEVLOG.md
```
