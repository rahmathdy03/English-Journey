# English Journey

**Learn Together. Grow Together.**

English Journey is a private, mobile-first English learning website for two users. The static frontend runs on GitHub Pages, while authentication and all learning progress are stored online in Google Sheets through a Google Apps Script Web App.

## Included features

- Two-profile PIN login with backend validation and expiring session tokens.
- Six daily lessons per week: 5 vocabulary words, 1 grammar topic, and 3 quizzes.
- Day 7 Weekly Challenge with XP, reward box, achievement checks, and next-week unlock.
- Sequential lesson locking, mistake review, vocabulary and grammar libraries.
- Dashboard, streaks, score charts, activity calendar, positive progress comparison, couple goals, achievements, and editable profile targets.
- Responsive bottom navigation on phones and sidebar navigation on larger screens.
- Loading, empty, error, retry, offline, success, and failure states.
- Progress is never stored in `localStorage`; only the temporary login session uses `sessionStorage`.

## Technology

- HTML5, CSS3, Vanilla JavaScript with ES Modules
- Google Apps Script and Google Sheets
- GitHub Pages
- Chart.js and Lucide Icons through CDN
- Web Speech API for vocabulary pronunciation

## Repository map

- `index.html` — landing page
- `pages/` — one HTML entry per feature
- `css/` — global, component, page, animation, and responsive styles
- `js/` — API clients, auth, components, services, utilities, and page controllers
- `data/` — editable curriculum reference files and Week 1 content
- `backend/` — complete Google Apps Script API and data setup
- `docs/` — architecture, setup, deployment, API, and troubleshooting guides

## Start here

1. Read `docs/google-sheets-setup.md` and `backend/README-BACKEND.md`.
2. Create an Apps Script project and copy every `.gs` file from `backend/` into it.
3. Add temporary Script Properties `SETUP_FINKA_PIN` and `SETUP_RAHMAT_PIN`.
4. Run `setupEnglishJourney()` once. It creates and prepares the spreadsheet, stores only hashed PINs, and deletes the temporary plaintext PIN properties.
5. Deploy Apps Script as a Web App and paste its `/exec` URL into `js/config.js`.
6. Test locally through a local HTTP server, then publish the repository with GitHub Pages.

Detailed instructions are in `docs/apps-script-deployment.md` and `docs/github-pages-deployment.md`.

## Local preview

Because the project uses ES Modules and `fetch`, do not open HTML files directly with `file://`.

```bash
python3 -m http.server 8000
```

Then open `http://localhost:8000/`.

## Curriculum

Week 1 is complete. Week 2 files are safe templates. Add future weeks in both `data/` and `backend/LessonData.gs` / `backend/QuestionBank.gs` before learners unlock them in production.

## Security notes

Never commit a PIN, PIN hash, Spreadsheet ID, Apps Script credential, or temporary setup property. GitHub Pages is public hosting, so all secrets must remain inside Apps Script Properties. Backend code recalculates quiz scores and never trusts a score sent by the browser.
