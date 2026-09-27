# Minimal Task Manager

A minimalist full-stack task manager with:

- React + Vite frontend
- Firebase Authentication (email/password)
- Node.js + Express backend
- Cloud Firestore database
- Per-user task authorization using Firebase ID tokens

## 1. Create Firebase project

In Firebase Console:

1. Create a project.
2. Add a Web app and copy its Firebase config.
3. Enable **Authentication → Sign-in method → Email/Password**.
4. Create a **Cloud Firestore** database.
5. In **Project settings → Service accounts**, generate a private key for the Admin SDK.

Firebase's web SDK supports email/password sign-up/sign-in, and the Admin SDK can verify Firebase ID tokens on a custom Node backend.

## 2. Configure the frontend

Copy `client/.env.example` to `client/.env` and fill in the Firebase web-app values:

```bash
cp client/.env.example client/.env
```

## 3. Configure the backend

Copy `server/.env.example` to `server/.env`.

Option A — service account JSON path:

```env
FIREBASE_SERVICE_ACCOUNT_PATH=/absolute/path/to/serviceAccountKey.json
```

Option B — individual service-account fields:

```env
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-...@your-project-id.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

For local development, Option A is usually simplest. Never commit the service account key.

## 4. Install and run

From the project root:

```bash
npm install
npm run install:all
npm run dev
```

Frontend: http://localhost:5173
Backend: http://localhost:4000

## API

All task endpoints require:

```http
Authorization: Bearer <firebase-id-token>
```

Routes:

- `GET /api/tasks`
- `POST /api/tasks`
- `PATCH /api/tasks/:id`
- `DELETE /api/tasks/:id`
- `GET /api/health`

The backend always uses the authenticated Firebase UID as the owner, so clients cannot choose another user's owner ID.

## Production notes

- Put the API behind HTTPS.
- Store Firebase Admin credentials in your hosting provider's secret manager.
- Set `CLIENT_ORIGIN` to the deployed frontend URL.
- Add rate limiting and request validation for production workloads.
- Consider email verification and password-reset UX as the app grows.
