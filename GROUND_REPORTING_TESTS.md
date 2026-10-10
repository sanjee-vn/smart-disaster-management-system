# Citizen Ground Reporting tests

Run from the repository root:

```powershell
npm run test:ground-reporting
```

This runs 49 backend and 16 mobile tests (65 total) in 8 focused test files.
Existing report tests were reorganised; this does not add new scenario coverage.

| Test file | Cases | Behaviour |
| --- | ---: | --- |
| backend/tests/groundReportValidation.test.js | 39 | Required fields, types, bounds, normalisation, optional photo |
| backend/tests/groundReportModel.test.js | 1 | Model validation and defaults without a database |
| backend/tests/groundReportService.test.js | 2 | Field whitelist, pending status, database errors |
| backend/tests/groundReportController.test.js | 6 | HTTP submission, ownership, invalid data, safe errors, health |
| backend/tests/reportPhotoUpload.test.js | 1 | Image signature validation |
| frontend/mobile/tests/reportFormValidation.test.cjs | 7 | Form, location and photo reference validation |
| frontend/mobile/tests/reportHelpers.test.cjs | 4 | Deduplication, status timeline, formatting and cache record checks |
| frontend/mobile/tests/reportCache.test.cjs | 5 | Receipt persistence, concurrent writes, account isolation and storage failures |

Run just one file from the repository root:

```powershell
node --test backend/tests/groundReportValidation.test.js
node --test frontend/mobile/tests/reportCache.test.cjs
```

Run each component side separately:

```powershell
npm --prefix backend run test:ground-reporting
npm --prefix frontend/mobile run test:ground-reporting
```

The separate mobile authValidation.test.cjs contains 3 shared authentication cases.
The project has 23 test files: 19 backend and 4 mobile. Full discovery measured
102 backend runner tests (101 passed, 1 failed) and 19 mobile tests (all passed).
Some older backend scripts count as one runner test per file and contain multiple assertions.
The unrelated hazard-warning publish test fails because incidents.insertOne()
is not mocked and times out waiting for MongoDB.

No 85% coverage claim is made. Offline draft synchronisation, full image upload,
UI interactions and duplicate submission prevention need further dedicated tests;
cached receipts and merged-history deduplication do not prove those behaviours.
