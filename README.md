# Minimal Task Manager — Netlify + Firebase

A minimalist full-stack task manager built with React/Vite, Express, Netlify Functions, Firebase Authentication, and Cloud Firestore.

## Architecture

- React + Vite frontend in `client/`
- Express API in `server/src/app.js`
- Local Node server entry point in `server/src/index.js`
- Netlify serverless entry point in `netlify/functions/api.js`
- Firebase Authentication for user login
- Firestore for per-user task storage

The Express application is shared between local development and Netlify Functions. Locally it runs on port 4000; on Netlify it is invoked as a serverless function behind `/api/*`.

## 1. Create the Firebase project

In Firebase:

1. Create a project.
2. Add a Web app and copy its configuration.
3. Enable Authentication → Sign-in method → Email/Password.
4. Create a Firestore database.
5. Deploy the included `firestore.rules` if you want the Firestore rules in this repository to be authoritative.
6. Create a Firebase Admin service account for the backend.

## 2. Local development

Requirements: Node.js 18.14+.

```bash
npm run install:all
cp client/.env.example client/.env
cp server/.env.example server/.env
npm run dev
```

The React app runs at `http://localhost:5173` and the Express API at `http://localhost:4000`.

For local Firebase Admin access, either set `FIREBASE_SERVICE_ACCOUNT_PATH` to your service-account JSON file or provide the three `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, and `FIREBASE_PRIVATE_KEY` variables.

## 3. Netlify deployment

Push this repository to GitHub, then create a new Netlify site from the repository.

The included `netlify.toml` configures:

- Build command: `npm run build`
- Publish directory: `client/dist`
- Functions directory: `netlify/functions`
- `/api/*` → the Express Netlify Function
- SPA fallback → `client/index.html`

### Netlify environment variables

Add these in Netlify → Project configuration → Environment variables:

Frontend build variables:

```text
VITE_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET
VITE_FIREBASE_MESSAGING_SENDER_ID
VITE_FIREBASE_APP_ID
```

Do not set `VITE_API_URL` in production unless your API is hosted somewhere else. With the default empty value, the React app calls `/api/...` on the same Netlify domain.

Backend/serverless variables:

```text
FIREBASE_PROJECT_ID
FIREBASE_CLIENT_EMAIL
FIREBASE_PRIVATE_KEY
```

For `FIREBASE_PRIVATE_KEY`, preserve the `\\n` line breaks if you paste the value into Netlify. The backend converts them back to real newlines.

Do not commit the Firebase service-account JSON or private key to Git.

After changing Netlify environment variables, trigger a new deploy because build/runtime values are applied to deploys.

## 4. Firebase authorized domain

After Netlify gives you a domain such as `your-site.netlify.app`, add that hostname under Firebase Authentication → Settings → Authorized domains.

If you later attach a custom domain, add that hostname too.

## 5. Test the deployed API

Once deployed, open:

```text
https://YOUR-SITE.netlify.app/api/health
```

You should receive:

```json
{"ok":true}
```

Then create an account and test creating, editing, completing, and deleting tasks.

## 6. Optional Netlify CLI development

Install dependencies and run:

```bash
npm run install:all
npm run dev:netlify
```

This runs the Vite frontend together with Netlify's local function environment.
