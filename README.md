# Trade Atlas

Maritime trade map and a local 3D aircraft explorer.

## Run locally

Use Node 22.13+ (Node 24 recommended), then run:

```sh
npm install
npm run dev
```

Open the Local URL printed by the server. Maritime is at `/`; aircraft are at `/aircraft`.

## Aircraft data

The app queries the public ADSB.lol point endpoint through `/api/aircraft?region=gulf`. No API key is currently required. The request identifies this public repository in its User-Agent. Provider terms and availability can change; rate limits are dynamic. See https://www.adsb.lol/docs/open-data/api/ and https://github.com/adsblol/api.

- Five selectable regions, each covering a 250 nautical mile radius.
- Polls every 30 seconds while visible and not paused. Server responses are cached for 30 seconds.
- Invalid coordinates, ground aircraft, duplicates and positions older than 60 seconds are omitted.
- No synthetic flight positions or inferred flight routes are supplied.
- Position age is estimated from provider `seen_pos` at retrieval time. Altitude is geometric when available, otherwise barometric, in feet; speed is in knots; direction is ground track.
- Models and altitude (25 times) are exaggerated for legibility. The globe is a visualization, not a navigation aid.
- Coverage is incomplete. API failures and stale updates are shown explicitly.
- 3D requires WebGL; the aircraft list remains available if the renderer cannot start.

The globe uses bundled public-domain Natural Earth land geometry. Maritime detailed tiles use OpenStreetMap with attribution.

## Checks

```sh
node --experimental-strip-types --test tests/aircraft.test.mjs
npx tsc --noEmit --incremental false
npm run build
```

The aircraft changes are local only. No commit, push, or deployment is needed to preview them.

## Higher-detail aircraft view

- Aircraft globe: Natural Earth 1:10m land geometry rendered into a texture up to 8192 × 4096 on desktop, or 4096 × 2048 on smaller screens, subject to GPU limits. It is cartographic coastline data, not satellite imagery or terrain.
- God-eye mode: top-down view with pan and zoom, centered on the selected aircraft or region. Orbit mode restores globe rotation.
- Representative twin-engine jet geometry (fuselage, wings, engines and tail), informed by A320 top-view photo references. It is not an exact digital twin or verified livery of any tracked aircraft. Visual reference: https://bau-xi.com/products/20101-delta-air-lines-airbus-a320-200 . Reference images are not bundled or copied into the model.
- Photos are looked up by aircraft hex through the Planespotters public photo API, displayed with photographer credit and the source link. No photos are bundled in this repository.
- Aircraft identity and callsign route lookups use adsbdb, on demand. Route data is displayed as an unconfirmed callsign lookup, not a current flight plan. Do not bulk copy it into a database; see the provider's terms at https://github.com/mrjackwills/adsbdb .
- A route cruise estimate uses great-circle distance divided by an assumed 450 kt. It is not an actual duration, timetable, or ETA.
- These sources do not confirm passenger/cargo operation, luggage contents, baggage allowances, or cargo manifests. A freighter is identified only where the registry type explicitly says so; actual load remains unknown.
