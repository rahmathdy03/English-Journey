# Google Sheets Setup

The project creates one spreadsheet with these tabs:

- `Users`
- `Sessions`
- `DailyProgress`
- `LearningHistory`
- `VocabularyProgress`
- `GrammarProgress`
- `WeeklyProgress`
- `Achievements`

## Automatic setup

1. Copy all backend files to one standalone Apps Script project.
2. Open **Project Settings → Script Properties**.
3. Add `SETUP_FINKA_PIN` and `SETUP_RAHMAT_PIN` with the private PIN values.
4. Run `setupEnglishJourney()` once.

The function creates a spreadsheet if `SPREADSHEET_ID` is absent, creates all tabs and headers, seeds Finka and Rahmat, creates a random PIN salt, hashes the temporary PINs, saves only the hashes, and deletes both temporary PIN properties.

## Existing spreadsheet

To use an existing blank spreadsheet, add its ID as the `SPREADSHEET_ID` Script Property before running setup. The setup function clears and rebuilds all project tabs, so do not point it at a spreadsheet containing important data.

## Backup

Back up the spreadsheet periodically through Google Drive. The frontend never keeps a second source of truth.
