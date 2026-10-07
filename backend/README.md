# Backend API

The API uses Express and Mongoose. Hazard and warning records are stored in MongoDB Atlas; resource coordination uses the same database connection.

## Local setup

1. Keep the Atlas connection string in `backend/.env` as `MONGODB_URI`. This file is ignored by Git. Use `.env.example` as the variable template.
2. Allow your current network IP in the Atlas Network Access list and ensure the database user has read/write access to the target database.
3. From this directory, run `npm install`, then `npm run seed:hazards` to insert missing sample hazard records. The seed command does not overwrite or delete existing records.
4. Run `npm run dev`. The API listens on port `5000` by default; set `PORT` to change it.
5. In `frontend/web`, copy `.env.example` to `.env` if you need a non-default API URL, then run the frontend dev server.

## Hazard and warning endpoints

All responses use `{ success, data }` on success and `{ success: false, error: { code, message } }` on failure.

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/api/health` | API liveness |
| `GET` | `/api/ready` | API and MongoDB readiness |
| `GET` | `/api/hazards` | List and filter hazards |
| `GET` | `/api/hazards/:id` | Get one hazard by public ID |
| `PATCH` | `/api/hazards/:id` | Update allowed assessment fields |
| `GET` | `/api/hazards/:id/draft` | Load the saved warning draft for a hazard |
| `PUT` | `/api/hazards/:id/draft` | Create or update the warning draft for a hazard |
| `GET` | `/api/warnings` | List warnings; optionally filter by `hazardId` or `status` |
| `GET` | `/api/warnings/:id` | Get a warning with its audit history |
| `POST` | `/api/warnings` | Validate, publish, and record a warning |
| `POST` | `/api/warnings/:id/retries` | Record a retry request for a selected channel |
| `POST` | `/api/warnings/:id/escalations` | Mark a published warning for review |
| `POST` | `/api/warnings/:id/cancellation` | Cancel a published warning |

Publishing and cancelling use MongoDB transactions so warning records and related hazard status updates stay consistent. Delivery and escalation are recorded as queued/review actions; telecom, push, siren, and external authority integrations are not configured in this prototype.

The current workflow keeps one editable warning draft per hazard. Saving again updates that draft so repeated saves do not create duplicate draft records.

## Quality checks

- `npm test` runs the unit tests for the hazard-warning service.
- `npm run test:coverage` prints Node's built-in coverage report for the exercised code.
- `npm run seed:hazards` can be rerun safely; existing sample hazard IDs are left unchanged.
