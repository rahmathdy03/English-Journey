# English Journey — Google Apps Script Backend

This folder is copied into one standalone Google Apps Script project. It provides a REST-like JSON API with `doGet` and `doPost`, session-token authentication, backend score calculation, Google Sheets persistence, and basic rate limiting.

## Initial setup

1. Create a standalone Apps Script project.
2. Copy every `.gs` file from this folder into that project.
3. In **Project Settings → Script Properties**, add temporary values:
   - `SETUP_FINKA_PIN`
   - `SETUP_RAHMAT_PIN`
4. Run `setupEnglishJourney()` once from the editor and approve permissions.
5. The setup creates a spreadsheet, writes its ID into `SPREADSHEET_ID`, hashes both PINs, and deletes the temporary plaintext PIN properties.
6. Set the project timezone to **Asia/Jakarta**.
7. Deploy as **Web app**, execute as yourself, and grant access to anyone who should use the site.
8. Paste the `/exec` URL into `js/config.js` in the frontend.

Never commit PINs, PIN hashes, spreadsheet IDs, or deployment credentials to GitHub. Do not publish the generated data spreadsheet.
