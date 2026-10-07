# Backend

Run `npm run dev` from this directory. MongoDB and authentication indexes must be ready before Express listens. `.env` requires `MONGODB_URI` and a random `JWT_SECRET` of at least 32 characters. A secret was generated locally for this workspace; it is ignored by Git and must never be copied into the mobile app.

## Authentication structure

```text
src/modules/auth/
  auth.model.js       User schema and unique normalized email
  auth.session.js     Revocable, expiring session records
  auth.validation.js  Registration/login input checks
  auth.service.js     Password hashing, login, session verification
  auth.controller.js HTTP responses
  auth.routes.js     Endpoints and rate limiting
src/middleware/auth.js Bearer-token verification for protected routes
```

| Method | Path | Behavior |
| --- | --- | --- |
| POST | /api/auth/register | Create citizen account: name, email, password |
| POST | /api/auth/login | Return token, expiry and safe user profile |
| GET | /api/auth/me | Validate session and return current profile |
| POST | /api/auth/logout | Revoke the current session |
| POST | /api/reports | Create a report for the authenticated citizen |
| GET | /api/health | Public health check |

Registration returns HTTP 201 and requires a separate login. Login returns `data.token`; send it as `Authorization: Bearer <token>` for protected endpoints. Passwords are hashed with bcrypt (cost 12). Passwords require at least 8 characters and at most 72 UTF-8 bytes. Name is limited to 100 characters and email to 254. Client-supplied roles are ignored.

Sessions last seven days. They are signed using HS256 with fixed issuer and audience and checked against an active session record and existing user. Logout deletes the current session record, so a copied token cannot be used afterward. Other device sessions remain valid. TTL cleanup removes expired sessions; authorization checks expiry directly and does not depend on cleanup timing.

Register/login share a limit of 20 failed requests per client IP within 15 minutes. This uses an in-process store for the current single-server development setup. A distributed deployment needs a shared limiter store. Email verification, password reset and refresh tokens are outside this implementation.

## Postman flow

Register:

```json
{ "name": "Your Name", "email": "you@example.com", "password": "your-own-password" }
```

Log in with email/password. Copy the response token into Postman's Bearer Token authorization field. Then send `POST http://localhost:5000/api/reports` with:

```json
{
  "title": "Flood near Galle Road",
  "description": "Water level is rising rapidly near the main road.",
  "disasterType": "Flood",
  "latitude": 6.0329,
  "longitude": 80.2168
}
```

The backend derives `citizenId` from the authenticated account and ignores an ID supplied in the body. Success returns HTTP 201 with `data`, `status: PENDING`, automatic timestamps and optional `photo: null`. Check the `groundreports` collection in the configured database. Real requests create real records.

Supported disaster types: Flood, Landslide, Storm, Drought, Fire, Earthquake, Other. Title is limited to 150 characters and description to 5000. Coordinates must be numeric within valid latitude/longitude ranges. Optional photo stores an HTTP(S) URL or `/uploads/` reference; file upload is not implemented.

## Checks

```powershell
npm test
npm run test:coverage
```

Tests use mocked database calls and temporary local HTTP servers. They cover hashing, validation, duplicate emails, credentials, invalid/expired/revoked sessions, rate limiting, report ownership, and safe errors. They do not connect to Atlas. The current development API uses local HTTP for Expo Go; a deployed authentication service must use HTTPS.
