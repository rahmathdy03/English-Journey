# Troubleshooting

## “Apps Script URL has not been configured”

Replace the placeholder in `js/config.js` with the deployed `/exec` URL. Keep the quotation marks.

## Login always fails

- Confirm `setupEnglishJourney()` finished successfully.
- Confirm `USER_FINKA_PIN_HASH`, `USER_RAHMAT_PIN_HASH`, and `PIN_SALT` exist in Script Properties.
- Do not leave temporary plaintext PIN properties after setup.
- Confirm the frontend points to the latest deployment version.

## Network or CORS-like error

- Use the `/exec` URL, not `/dev`.
- Confirm the Web App access setting permits both users.
- Test the endpoint in a normal browser window while signed out of the Apps Script editor.
- Do not open the site through `file://`; use GitHub Pages or a local HTTP server.

## Progress is not visible

Check the relevant Google Sheet tab. The frontend intentionally does not invent fallback progress when the API fails. Verify session validity, sheet headers, deployment version, and internet access.

## Week 2 says content is unavailable

Week 1 is complete. Week 2 JSON files are templates. Add the next curriculum to frontend data files and the trusted backend constants before allowing production users to unlock it.

## Icons or charts do not appear

Lucide Icons and Chart.js are loaded from CDNs. Check internet access and browser content blockers.

## GitHub Pages link opens a 404

Ensure the repository root contains `index.html`, Pages is configured for the correct branch/root, and filename capitalization matches the links exactly.
