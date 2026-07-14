# Architecture

## Request flow

1. A browser loads the static frontend from GitHub Pages.
2. The user selects a profile and submits a PIN over HTTPS to the Apps Script Web App.
3. Apps Script verifies a salted SHA-256 PIN hash stored in Script Properties.
4. Apps Script returns a random, expiring session token. The browser keeps it only in `sessionStorage`.
5. Every protected request sends the token. Apps Script validates the token hash and expiry before reading or writing Google Sheets.
6. Quiz answers—not scores—are submitted. Apps Script loads its private answer bank, recalculates the score, updates review counts, unlocks progress, and returns the verified result.

## Frontend layers

- `pages/*.html`: lightweight page entry points.
- `js/pages/`: page-specific controllers.
- `js/api/`: small wrappers around the REST-like API.
- `js/auth/`: session, guard, and logout behavior.
- `js/components/`: reusable navigation, cards, modal, toast, loader, and states.
- `js/services/`: pure learning and presentation logic.
- `js/utils/`: DOM, formatting, sanitizing, validation, and error helpers.
- `css/components/` and `css/pages/`: scoped visual responsibilities.

## Backend layers

- `Code.gs`: request router.
- `AuthService.gs`: login, logout, and session validation.
- `LessonService.gs`, `QuizService.gs`, `WeeklyChallengeService.gs`: learning rules.
- `ProgressService.gs`, `AnalyticsService.gs`, `AchievementService.gs`: derived progress.
- `SpreadsheetService.gs`: table reads and writes.
- `LessonData.gs`, `QuestionBank.gs`: trusted backend curriculum and answer key.
- `ValidationService.gs`, `RateLimitService.gs`, `CryptoService.gs`: defensive controls.

## Data consistency

Writes use a Script Lock where multi-table changes must stay coordinated. User totals are recalculated from source rows instead of trusting frontend totals. A page shows “saved” only after the API returns success.
