# Overload — Progressive Overload Workout Tracker

A mobile-first Push/Pull/Legs workout tracker. Sign in with Google and your data syncs across every device via Firebase — no other accounts, no server you have to run.

## Features

- Default Push / Pull / Legs workout days, fully customizable (add, edit, delete, reorder exercises)
- Start-workout view shows each exercise's previous performance right next to today's inputs
- Fast set entry: tapping a weight/reps field auto-selects the existing value so you can just type over it
- Skip exercises or leave sets incomplete and still save the workout
- Full workout history with delete
- Per-exercise progress graphs (weight over time) with a PR badge and trend delta
- Google sign-in, data synced across devices via Firestore, works offline with automatic sync when back online
- YouTube Shorts button on each exercise during a workout — auto-searches a demo video by exercise name, with Previous/Next to browse more and a favorite button; favorited videos show up first next time

## One-time Firebase setup

1. Go to [console.firebase.google.com](https://console.firebase.google.com) and click **Add project**. Name it anything (Google Analytics can be off).
2. Once created, click the **web icon (`</>`)** on the project overview page to register a web app. Give it any nickname, no need for Firebase Hosting.
3. Copy the `firebaseConfig` object it shows you — you'll need it in step 6.
4. In the left sidebar, go to **Build → Authentication → Get started**. Under **Sign-in method**, enable **Google**, pick a support email, save.
5. In the left sidebar, go to **Build → Firestore Database → Create database**. Choose a region close to you, start in **production mode**.
6. Open `src/firebase.js` in this project and replace the placeholder `firebaseConfig` values with the ones from step 3.
7. In Firestore, go to the **Rules** tab and paste the contents of `firestore.rules` (included in this repo) in place of the default rules, then **Publish**. This ensures each signed-in user can only read/write their own data.
8. Back in **Authentication → Settings → Authorized domains**, click **Add domain** and add your GitHub Pages domain, e.g. `<your-username>.github.io`. Without this, Google sign-in will fail once deployed (localhost is allowed by default for local dev).

That's it — no billing required, this all runs comfortably inside Firebase's free Spark plan for personal use.

## One-time YouTube setup (optional, for exercise demo Shorts)

1. Go to [console.cloud.google.com](https://console.cloud.google.com) and select or create a project (can be the same project you used for Firebase, or a separate one).
2. In the left sidebar, go to **APIs & Services → Library**, search for **YouTube Data API v3**, and click **Enable**.
3. Go to **APIs & Services → Credentials → Create Credentials → API key**. Copy the key.
4. (Recommended) Click **Edit** on the new key and restrict it: under **API restrictions**, limit it to **YouTube Data API v3**. Under **Application restrictions**, choose **HTTP referrers** and add `localhost/*` and your GitHub Pages domain, e.g. `<your-username>.github.io/*`.
5. Open `src/youtube.js` and replace the placeholder `YOUTUBE_API_KEY` value with your key.

The free quota (10,000 units/day) comfortably covers personal use — each search costs about 100 units. Without a key configured, the YouTube button still appears but shows a message instead of search results.

## Run it locally

```bash
npm install
npm run dev
```

## Deploy to GitHub Pages

**GitHub Actions (already set up):**

1. Push this project to a GitHub repository.
2. In the repo, go to **Settings → Pages → Source** and select **GitHub Actions**.
3. Push to `main` — the included workflow (`.github/workflows/deploy.yml`) builds and deploys automatically.
4. Your app will be live at `https://<username>.github.io/<repo-name>/`.
5. Don't forget step 8 above (authorized domain) or sign-in will fail on the live site.

> The Vite config uses a relative `base: './'`, so the build works regardless of the repo name or sub-path it's served from.

## Data & privacy

Your workout data lives in Firestore under a document scoped to your Google account UID, protected by the security rules in `firestore.rules`. Firestore's local cache also means the app keeps working offline — changes sync automatically once you're back online. The Firebase web config values in `src/firebase.js` are not secret (this is normal for Firebase web apps); protection comes from the security rules, not from hiding those values.

## Tech

React 19 + Vite 5, Firebase (Auth + Firestore), `recharts` for progress graphs.
