# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

TaksiSOS is a real-time, location-based emergency assistance app (Turkish). Users share live location; pressing SOS notifies other users within a 5km radius (Haversine distance) and opens a shared emergency room for text chat, recorded voice messages, and live push-to-talk audio. Code comments and commit messages are largely in Turkish.

This is a monorepo with three independent apps that don't share a build system:
- **Root (`app.js`)** — Node.js/Express + Socket.io backend, deployed to Render (admin panel defaults to `https://taksisos-project.onrender.com`).
- **`taxi-sos-mobile/`** — Expo/React Native client (iOS & Android) for end users.
- **`taxi-sos-admin/`** — Vite + React + TypeScript web dashboard for moderators (live map, user approvals, SOS archives).

## Commands

### Backend (root)
```
npm start          # node app.js — starts Express+Socket.io server on $PORT (default 5000)
npm test           # runs jest (config: tests/ptt-mutex.test.js)
npx jest tests/ptt-mutex.test.js -t "should grant talk"   # run a single test
```
The PTT mutex test forks a real `app.js` process on port 5001 and drives it with two `socket.io-client` connections — it needs the port free and Firebase credentials resolvable (see Backend architecture below).

### Mobile (`taxi-sos-mobile/`)
```
npm start           # expo start
npm run android     # expo start --android
npm run ios         # expo start --ios
npm run web         # expo start --web
npm run lint        # expo lint
```
`postinstall` runs `patch-package` — patches in `patches/` (react-native, react-native-live-audio-stream) are applied automatically on `npm install` and must not be dropped by reinstalling raw packages.

### Admin (`taxi-sos-admin/`)
```
npm run dev         # vite dev server
npm run build       # tsc -b && vite build
npm run lint        # eslint .
npm run preview
```

## Backend architecture (`app.js`)

Everything lives in a single file. Key points for anyone touching it:

- **State is in-memory, not persisted**: `users` (connected sockets), `registeredDevices` (push tokens, survives disconnects), `activeArchives` (in-progress SOS sessions), `channelStates` (per-room PTT lock), `writeStreams` (per-socket active audio write stream) are plain module-level objects/arrays. A server restart loses all of this. There is no Redis/multi-instance support — do not assume horizontal scaling works.
- **Persistent storage**: Firebase Firestore holds `users` (profile/auth/status), `sos_archives` (completed SOS sessions), `voice_messages` (PTT recording metadata). Firebase Storage holds driver ID card photos (`driver_cards/`) and finished voice recordings (`voice_messages/<room>/<id>.wav`).
- **Auth model**: phone+password login (bcrypt) issuing a short-lived JWT `accessToken` (1h) and long-lived `refreshToken` (30d, tied to a per-user `tokenVersion` so `/api/logout` or an admin ban can invalidate all outstanding refresh tokens by bumping the version). REST endpoints are unauthenticated beyond payload checks (no middleware) except the implicit trust in the mobile client sending the right JWT; Socket.io connections are authenticated in the `io.use()` middleware via `socket.handshake.auth.token` (or `adminPassword` for the admin dashboard) and re-validated against Firestore approval status on every connect. `socket.on('update_token', ...)` lets a client swap in a refreshed access token without reconnecting.
- **User approval workflow**: registration creates a Firestore user with `status: 'pending'` and an uploaded ID photo; admin endpoints (`/api/admin/*`) move status to `approved`/`rejected`/`banned`, deleting the ID photo from Storage on any terminal decision (KVKK/privacy compliance). Only `approved` users can open a Socket.io connection.
- **SOS lifecycle**: `sos_trigger` creates a room named `sos_room_<phone>`, opens an `activeArchives` entry, alerts nearby *connected* sockets via `sos_alert`, and separately pushes Expo notifications to *all* registered devices within range (so it also reaches users with the app closed) via `expo-server-sdk`. `end_sos` closes the room, evicts all sockets from it, and persists the archive to `sos_archives`. `join_sos_room`/`leave_sos_room` manage helpers joining/leaving an existing SOS room; joining a room that no longer has an active archive triggers a client-side `sos_ended` correction.
- **Push-To-Talk (PTT) audio**: one speaker at a time per room, enforced server-side via `channelStates[room]`. `request_talk` grants/rejects based on whether the channel is locked; granted speakers stream base64 PCM chunks via `audio_chunk`, which the server both rebroadcasts live to listeners (`receive_audio_chunk`) and appends to a per-socket temp `.raw` file. `stop_talk` finalizes: converts the raw PCM to a WAV (manual 44-byte header via `getWavHeader`), uploads it to Firebase Storage, records it in Firestore/the archive, broadcasts the permanent URL as a `chat_message`, and deletes the temp files (disk cleanup matters on Render's ephemeral filesystem). There is also a separate, older `voice_message`/`play_voice` event pair for one-shot recorded voice messages sent as a single base64 blob — a different code path from the streaming PTT one; don't conflate the two when working on audio.
- Live location is broadcast globally on every `live_location`/`location_update` event with an O(n) distance computation against all connected users — see `PROJE_ANALIZI.md` for known scalability caveats (no geospatial index, no server clustering).

## Mobile app architecture (`taxi-sos-mobile/`)

- Routing is via Expo Router (`app/_layout.tsx`, `app/index.tsx`). **`app/index.tsx` is a ~1900-line monolith** containing nearly all screen state, the Socket.io client, auth/token refresh logic, SOS flow, chat, and map UI — expect to navigate within this one file for most feature work rather than finding separate screen components.
- Auth tokens are the single source of truth in `expo-secure-store` (`refreshToken`), not AsyncStorage; `app/index.tsx` runs a periodic (`5 min`) `refreshTokenIfNeeded` check against `/api/refresh` plus a foreground-resume refresh. This was a deliberate refactor (see recent commits "JWT Single Source of Truth" and "Fix SecureStore crash when backend lacks refreshToken") — a backend response without `refreshToken` must be handled defensively, not assumed present.
- PTT client logic is isolated in `hooks/usePTT.ts`, using `react-native-live-audio-stream` for mic capture/playback plumbing and the same `request_talk`/`audio_chunk`/`stop_talk` event contract as the backend. Real-time playback of incoming `receive_audio_chunk` streams has historically been a soft spot (jitter buffering) — see `SES_AKISI_RAPORU.md` for the original gap analysis before assuming streaming playback is fully solved.
- Firebase is initialized in `firebaseConfig.ts` and used mainly for phone auth token verification support and any client-side Firebase Storage reads; Firestore reads/writes for domain data mostly go through the Node backend's REST/Socket API, not directly from the client.
- `tabs_backup/`, `app/index.tsx.bak`, `modal_backup.tsx`, `metro.config.js.bak` are stale backup files kept in-tree from earlier iterations — do not treat them as active code paths.
- Native patches for `react-native` and `react-native-live-audio-stream` live in `patches/` and are required for the audio streaming feature to function; if you need to touch native audio behavior, check there first before assuming upstream package behavior.

## Admin dashboard architecture (`taxi-sos-admin/`)

Single-page React app (`src/App.tsx`) that authenticates to the backend via a shared `adminPassword` over the Socket.io handshake (not JWT), then renders a Leaflet live map of connected users/active SOS rooms plus tabs for `Archive` (past SOS sessions from `/api/sos-archives`), `Approvals` (pending user review from `/api/admin/pending-users`), and `UsersList`/`UserProfileModal` (full user management, ban/delete). It talks to the same backend REST+Socket API as the mobile app — there is no separate admin backend.

## Cross-cutting notes

- Analysis/notes docs at the repo root (`PROJE_ANALIZI.md`, `SES_AKISI_RAPORU.md`, `IOS_CRASH_ANALIZI.md`, `HATA_ANALIZ_RAPORU.md`) are Turkish-language engineering notes written during development, not authoritative specs — useful for background on *why* something is shaped a certain way, but verify against current code since the codebase has moved on from some of them (e.g. real-time PTT audio streaming has since been implemented per git history, despite `SES_AKISI_RAPORU.md` describing it as incomplete).
- `firebase-service-account.json` and `AuthKey_ZQ25H9XZVQ.p8` are real credentials checked into the working tree — never print their contents, and be careful not to include them in anything shared externally. In production (Render), the backend expects `FIREBASE_CREDENTIALS` as an env var instead of the JSON file.
- `temp_audio/` accumulates raw/wav files during local PTT testing; these are transient and safe to delete, but note the backend relies on cleaning up its own temp files after each `stop_talk` — don't rely on this directory being empty.
