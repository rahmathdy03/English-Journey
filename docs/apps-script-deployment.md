# Apps Script Deployment

1. Go to Google Apps Script and create a **standalone project**.
2. Create files matching every `.gs` file in `backend/`, then paste their contents.
3. Set the project timezone to `Asia/Jakarta`.
4. Add the two temporary PIN properties described in `google-sheets-setup.md`.
5. Run `setupEnglishJourney()` and approve the requested Google Sheets permissions.
6. Confirm the returned spreadsheet URL and inspect its tabs.
7. Select **Deploy → New deployment → Web app**.
8. Set **Execute as** to yourself.
9. Choose an access level that permits Finka and Rahmat to call the endpoint. For a GitHub Pages frontend, the Web App must be reachable by its users without an Apps Script editor login flow.
10. Deploy and copy the URL ending in `/exec`.
11. Open `js/config.js` and replace `PASTE_YOUR_APPS_SCRIPT_WEB_APP_URL_HERE`.

After backend code changes, create a new Web App version through **Manage deployments → Edit → New version**. A saved editor change does not automatically update an existing versioned deployment.

Never use the `/dev` URL in production. It is intended for editor testing and may require the owner account.
