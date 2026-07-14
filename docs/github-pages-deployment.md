# GitHub Pages Deployment

1. Create a new GitHub repository.
2. Upload the contents of the `english-journey` folder to the repository root.
3. Confirm that `js/config.js` contains the deployed Apps Script `/exec` URL.
4. Open **Settings → Pages**.
5. Under **Build and deployment**, choose **Deploy from a branch**.
6. Select the main branch and `/ (root)` folder, then save.
7. Open the generated Pages URL and test login, one lesson, all quiz types, and a saved result on both a phone and laptop.

All internal links and module imports use relative paths so the project also works under a repository subpath such as `username.github.io/english-journey/`.

## Updating the website

Edit or replace files, commit, and push to the same branch. GitHub Pages republishes the static site. Backend changes must be deployed separately in Apps Script as a new Web App version.
