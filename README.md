# Trade Atlas

Interactive maritime trade map, aircraft tracking, and regional activity history.

## Local setup

Use Node 24. Run `npm install`, then `npm run dev`. This starts the web app and a local traffic collector on loopback port 4319. Open the web URL printed in the terminal. Maritime tracking and the activity panel are at `/`; the flat aircraft map is at `/aircraft`.

For free global vessel reports, create a key at https://aisstream.io/account and put this line in your private file at `%LOCALAPPDATA%\TradeAtlas\.env` (Windows):

```dotenv
AISSTREAM_API_KEY=your_key_here
```

Restart `npm run dev` after adding the key. The collector reads it only on the server. On Windows this private file sits outside the repository and OneDrive. Restrict its Windows permissions to your account and system administrators. The web process does not inherit AISSTREAM_API_KEY from the launcher. `.env*` files and `.traffic-data/` are also ignored by Git. Never commit a real key. Without a key, aircraft collection works and vessel counts are unavailable, not zero.

If the web server is already running, `npm run dev:traffic` starts only the collector. `npm run dev:web` starts only the web app. One collector should run per project; port conflicts are reported rather than silently starting duplicates.

## Vessel observations

AISStream supplies positions, ship identity/type, and voyage destinations when broadcast. It requires a free API key. The collector uses one compressed WebSocket connection for the eight map regions and reconnects with exponential backoff. Source: https://aisstream.io/documentation .

Vessels appear only after position reports arrive. Static voyage data can arrive later. The UI shows AIS categories such as tanker, cargo, and passenger vessel; these do not confirm the cargo aboard. Actual cargo manifests are unavailable. Destination is crew-entered, can be outdated, and is shown as reported. Position age is measured from local receipt, not a verified satellite acquisition timestamp. Only reports received in the last ten minutes are counted/displayed; coverage is incomplete.

## Activity history

The maritime page compares aircraft and vessels within the same 100-nautical-mile circle around the selected chokepoint. Aircraft positions come from ADSB.lol (https://www.adsb.lol/docs/open-data/api/) and must be airborne and at most 60 seconds old. Counts represent observed objects, not crossings, totals, cargo volume, or complete air/sea traffic.

The collector samples approximately once a minute for areas viewed within the last three minutes. It saves at most 24 hours / 1,440 observations per area in `.traffic-data/history.json`, surviving restarts. It does not backfill history before collection. The web page refreshes every ten seconds while visible. Requests pause in hidden tabs; collection for an inactive region stops after three minutes. Keep the local app running and the region visible to build history.

Choose 1h, 6h, or 24h and use the slider to inspect recorded counts. The map remains at the latest received positions: the slider is count history, not vessel-track replay. Unavailable feeds are null, not zero; collection gaps longer than two minutes break chart lines. Aircraft and vessel observation windows differ as documented above.

This collector is local-only. A hosted version needs a separately hosted persistent collector and authenticated proxy; deploying the existing site alone will not provide this local service.

## Aircraft details and maps

The aircraft page uses a flat Natural Earth 1:10m coastline map with fast region/aircraft transitions. Coastlines are cartographic data, not satellite imagery. Maritime detailed tiles use OpenStreetMap with attribution. The representative Three.js aircraft/globe modules remain in source, but the current map uses flat symbols.

Aircraft identity and callsign routes are looked up on demand through adsbdb (https://github.com/mrjackwills/adsbdb); routes are unconfirmed callsign matches. Do not bulk copy route data into a database. Photos use the Planespotters public API with photographer credit/source links, not bundled images. Duration is a direct-route cruise estimate at an assumed 450 kt, not an actual duration, timetable, or ETA. These APIs do not confirm baggage contents or manifests.

## Checks

```sh
node --test tests/traffic.test.mjs
node --experimental-strip-types --test tests/aircraft.test.mjs
npx tsc --noEmit --incremental false
npm run build
```

