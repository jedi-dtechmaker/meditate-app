# Meditate on the Word

An Android-first Scripture meditation app built with Expo SDK 58, React Native,
TypeScript, Express, and Supabase. Sign-in is required. iOS is configured for a
later testing and release phase.

## Start here

Follow **[Android and new Supabase setup](docs/ANDROID_SETUP.md)** to create the
account backend, configure email confirmation, run the API, and install a native
Android development build. Real account access requires a configured Supabase
project and the included SQL migration. No guest or fake authentication is used.

```sh
npm ci
cp .env.example .env
cp apps/mobile/.env.example apps/mobile/.env
# Fill in your project settings, then run these in separate terminals:
npm run dev
npm run mobile
```

The API listens on port 3000. The app's API URL must be reachable from the phone
(10.0.2.2 for an Android emulator, your LAN address for a physical development
phone, or a hosted HTTPS URL for a distributed build).

## Implemented Android flow

- Required email/password sign-in, account creation, email confirmation and password recovery.
- Personal onboarding, Scripture focus, translation, duration, voice, music, theme and reminder preferences.
- All 66 books in bundled KJV, BBE, WEB, ASV and YLT, chapter reading, reference and keyword search, and saved verses.
- Native quiet/piano meditation with duration selection, pause/resume, playback controls,
  checkpoint recovery, and actual session records. Finite bundled audio ends natively
  instead of depending on a background JavaScript countdown.
- Journaling with draft recovery, editing, deletion, and optional microphone transcription.
- Personal history, totals, consecutive-day streaks and a seven-day activity display.
- AI companion, daily prayer reflections, and Scripture narration through the authenticated API.
- SQLite saves scoped to each account, cloud synchronization, deletion tombstones,
  and explicit conflict resolution when devices edit the same record.
- Android reminder scheduling, local sign-out cleanup, and password-confirmed account deletion.

AI requires a server-side Gemini key. The account-backed core works without it.
All five Bible translations and meditation audio are bundled for offline use after
sign-in. A new device must connect once to load the user's account data.

## Architecture

```text
apps/mobile/          Expo Router screens, native capabilities, account cache and sync
api/                  Verified authentication, private data API, AI endpoints and quotas
shared/               Record models, validation, merge rules and progress calculations
supabase/migrations/  PostgreSQL records, ownership policies, atomic sync and AI usage
server.ts             API entry point
data/bible/           Bundled Bible translation datasets
src/                  Original React web concept, retained as a design reference
```

The mobile client sends its Supabase access token to the API. The API verifies
that token and uses the user's own database context. Database read policies and
write functions enforce ownership independently of client-provided IDs. Passwords
are managed by Supabase Auth. Server secrets and AI keys stay out of the app.

## Verification

```sh
npm run typecheck
npm run lint
npm test
npm run bundle:android
```

`tests/database.test.sql` adds actual PostgreSQL integration assertions. See the
setup guide for running them in an isolated test database. CI runs those checks
and exports the Android JavaScript bundle.

A successful export is not an installable APK or a device test. Native background
audio, reminders, microphone behavior, email deep links and release credentials
must be checked on an installed Android build before publishing. No cloud project,
API deployment, Expo account or store release is created automatically.

## Android builds

From `apps/mobile`, sign into an Expo account with access to the linked team project, then:

```sh
npm run build:android     # internal test APK
npm run build:production  # Google Play App Bundle
```

Use the supplied `Dockerfile` for the API and `eas.json` for Android builds.
Production app builds require the public Supabase configuration and an HTTPS API.

Bundled piano recording credits: [audio credits](apps/mobile/assets/audio/CREDITS.md).
