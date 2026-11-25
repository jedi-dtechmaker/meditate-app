# Android development and a new Supabase project

## 1. Create the account backend

1. Create a Supabase project in a region near your users.
2. In its SQL editor, run `supabase/migrations/202611170001_accounts_and_sync.sql`.
   Alternatively, link the Supabase CLI to the project and run `supabase db push`.
   **Do not run `tests/database-bootstrap.sql` in Supabase**: it is only a test fixture.
3. Keep email/password sign-in and email confirmation enabled in Authentication.
4. In Authentication URL Configuration, set the Site URL to
   `meditateword://auth/callback` and add both redirect URLs:

   - `meditateword://auth/callback`
   - `meditateword://auth/callback?intent=recovery`

5. Copy the project URL and **publishable** key from the project's API settings.
   Keep its server secret/service-role key in the API environment only. That key
   allows account deletion; it must never be included in the Android bundle.
6. Configure a real email sender before inviting public users. Test the welcome
   confirmation and password reset emails on an installed Android development build.
   Open confirmation/reset links on the phone that requested them (PKCE).

Supabase setup references:
[Expo quickstart](https://supabase.com/docs/guides/getting-started/quickstarts/expo-react-native),
[redirect URLs](https://supabase.com/docs/guides/auth/redirect-urls).

## 2. Configure and run the API

At the repository root:

```sh
npm ci
cp .env.example .env
```

Fill in the Supabase settings in `.env`. Add a Gemini key to enable AI features.
Without that key, Bible reading, saved verses, meditation and journals still work;
AI requests return an availability message instead of pretending to succeed.

```sh
npm run dev
```

The API listens on `0.0.0.0:3000`. `/api/health` is public; the other API routes
require the user's verified Supabase bearer token. `NODE_ENV=production` refuses
to start without the Supabase URL and publishable key.

## 3. Configure the Android app

```sh
cp apps/mobile/.env.example apps/mobile/.env
```

Use the same project URL and publishable key. For `EXPO_PUBLIC_API_URL`:

- Android emulator: `http://10.0.2.2:3000`
- Physical phone: your computer's LAN URL, such as `http://192.168.1.10:3000`.
  Put the phone and computer on the same network and allow the API port through
  your computer's firewall.
- Preview/production builds used away from your network: a hosted **HTTPS** API.

Only values prefixed `EXPO_PUBLIC_` belong in the app's environment. Restart Metro
after changing environment variables.

## 4. Install an Android development build

From `apps/mobile`:

```sh
npx eas-cli@latest login
```

The app is linked to the `jedidtechmakers-team/meditate-on-the-word` Expo project
in `apps/mobile/app.config.ts`. Sign in with an account that has access to that
team, then continue:

```sh
npx eas-cli@latest build --platform android --profile development
npx expo start --dev-client
```

Install the generated Android build, then open the Metro QR code with it.
Expo Go can preview some screens, but the development build is the target for
deep links, Android playback controls, microphone behavior, and notifications.

If you already have Android Studio and its SDK installed, `npx expo run:android`
can build locally instead. Native projects are generated; change `app.config.ts`
and config plugins rather than editing generated `android/` files.

`com.dabbie.meditateword` is the current package identifier. Choose the final
identifier before publishing the app.

## 5. Create a shareable test APK

The `preview` profile already produces an APK for direct installation. The APK
contains the API URL at build time, so first put the API somewhere reachable from
the client's phone. A private address such as `192.168.x.x` works only on the
same network.

### Host the API on Render

The repository includes a `render.yaml` blueprint and Dockerfile for a free
Render web service. Render deploys from Git, so commit and push the intended
project files—including the Dockerfile, `render.yaml`, API, shared code,
`data`, `package.json`, and `package-lock.json`—to a GitHub repository you
control. Check `git status` and review the files before committing. Do not commit
either `.env` file.

1. Create/sign in to a Render account, choose **New → Blueprint**, and connect
   the repository and branch containing `render.yaml`.
2. Choose the free service and enter the following values from the root `.env`
   in Render's environment settings: `SUPABASE_URL`,
   `SUPABASE_PUBLISHABLE_KEY`, and `GEMINI_API_KEY`. Keep the Gemini key on the
   server; never put it in an `EXPO_PUBLIC_` variable. The optional
   `SUPABASE_SERVICE_ROLE_KEY` can be added on Render to enable account deletion.
3. Deploy. Open `https://YOUR-SERVICE.onrender.com/api/health` and verify it
   reports `ok: true` and `accountsConfigured: true`. A health response checks
   configuration presence, so also test sign-in and synchronization from a phone.
4. Copy the service's HTTPS base URL, without `/api/health`. This is the API URL
   for the APK. The free service sleeps after inactivity and can take about a
   minute to wake, so the first request may need a retry.

### Configure the preview build

In the Expo dashboard for `jedidtechmakers-team/meditate-on-the-word`, open
**Project settings → Environment variables**, select the **preview**
environment, and add these values:

- `EXPO_PUBLIC_SUPABASE_URL`: the same Supabase project URL used by the API.
- `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`: that project's publishable key.
- `EXPO_PUBLIC_API_URL`: the Render HTTPS base URL from above.

The `EXPO_PUBLIC_` values are bundled into the APK and are visible to users.
Do not add the Gemini key or Supabase service-role key to the mobile app.
The local `apps/mobile/.env` is ignored by Git and is not automatically present
on EAS Build servers.

Then, from `apps/mobile`:

```sh
npx eas-cli@latest login
npx eas-cli@latest project:info
npx eas-cli@latest build --platform android --profile preview
```

When prompted, let EAS generate an Android keystore if you do not already have
one. Keep using that keystore for later updates. Once the build finishes, open
its EAS build page and share the install link or download its APK. The client
opens the link on Android, downloads the APK, allows their browser to install
apps when prompted, and installs it. This standalone APK does not need Expo Go
or your Metro server.

Test signup using the client's email address. Supabase's default email service
has restrictions on recipients; configure custom SMTP if the client cannot
receive confirmation or password-reset emails.

The production profile produces an Android App Bundle for Google Play and
rejects missing configuration or an HTTP API URL:

```sh
npx eas-cli@latest build --platform android --profile production
```

## Device acceptance checks

- Create two real accounts; confirm email, sign in, reset a password, and reopen
  the app. Accounts must never see one another's notes or conversations.
- Finish a meditation, save a reflection, then force-close and reopen the app.
- Read/search the bundled translations and save a reflection in airplane mode.
  Reconnect and verify the changes from another signed-in device.
- Edit the same reflection on two offline devices. Sync both and resolve the
  conflict in Settings; verify neither version disappeared silently.
- Lock the phone during piano and quiet sessions. Check pause/resume controls,
  Bluetooth/headphone disconnection, calls, and the selected audio end time.
  A killed app recovers the last saved checkpoint as paused; it does not invent
  time spent after the process stopped.
- Allow/deny microphone and notification permissions. Verify the chosen daily
  reminder, including app restarts. Signing out cancels this account's reminder.
- Test AI success, loss of connection, and quota exhaustion with a configured key.
- Sign out and switch accounts; confirm local copies were cleared. Delete a test
  account with its password and confirm its database records were removed.

These device checks require an installed Android build. A JavaScript export,
typecheck, or SQL test does not prove native behavior on a phone.

## Dependency follow-up before release

The dependency audit identified `picomatch` in Expo/Metro tooling, covered by
[GHSA-fc5q-39xc-vjpf](https://github.com/advisories/GHSA-fc5q-39xc-vjpf).
The upstream advisory lists no patched release as of November 17, 2026. The app
and API do not accept glob patterns from users, but the toolchain audit remains
flagged. Re-check for an upstream fix and repeat the build checks before a public
release. The separate `minimatch` advisory is addressed by the root override and
the lockfile's version 11.0.9.

Expo Doctor's online configuration-schema check could not reach the Expo API
in the implementation environment. Local TypeScript, lint, Android prebuild and
Android bundle checks are the available verification; rerun `npx expo-doctor`
on a connection that can reach Expo before building for testers.

## Automated checks

At the repository root:

```sh
npm run typecheck
npm run lint
npm test
npm run bundle:android
```

For SQL integration checks in a **fresh local test database**, run:

```sh
psql "$TEST_DATABASE_URL" -v ON_ERROR_STOP=1 \
  -f tests/database-bootstrap.sql \
  -f supabase/migrations/202611170001_accounts_and_sync.sql \
  -f tests/database.test.sql
```

The test fixture supplies a minimal Auth schema; hosted Supabase supplies the
real Auth service. Tests cover ownership, idempotency, stale edits, deletion
tombstones, account deletion cascades, and persistent AI quotas.
