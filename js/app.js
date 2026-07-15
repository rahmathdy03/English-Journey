import {
  initWhatsNew
} from "./components/whats-new.js";

import { sidebar } from "./components/sidebar.js";

import {
  mobileNav,
  initMobileNav
} from "./components/navbar.js";

import { requireAuth } from "./auth/auth-guard.js";
import { refreshIcons } from "./utils/dom.js";

export function initProtectedPage({
  active = "dashboard",
  title = ""
} = {}) {
  if (!requireAuth()) {
    return null;
  }

  const app = document.getElementById("app");

  if (!app) {
    return null;
  }

  app.className = "app-shell";

  app.innerHTML = `
    ${sidebar(active)}

    <main class="main-area">
      <div class="page-container">
        <div
          class="internet-banner ${
            navigator.onLine ? "hidden" : ""
          }"
          id="internet-banner"
        >
          <i data-lucide="wifi-off"></i>

          Internet is required because progress is stored
          in Google Sheets.
        </div>

        <div id="page-content"></div>
      </div>
    </main>

    ${mobileNav(active)}
  `;

  document.title = `${
    title ? title + " · " : ""
  }English Journey`;

  const internetBanner = document.getElementById(
    "internet-banner"
  );

  window.addEventListener("online", () => {
    internetBanner?.classList.add("hidden");
  });

  window.addEventListener("offline", () => {
    internetBanner?.classList.remove("hidden");
  });

  refreshIcons();
  initMobileNav();
  initWhatsNew();

  return document.getElementById("page-content");
}

export function pageHeader(
  title,
  subtitle = "",
  actions = ""
) {
  return `
    <header class="page-header">
      <div>
        <p class="eyebrow">English Journey</p>
        <h1>${title}</h1>

        ${
          subtitle
            ? `<p class="muted">${subtitle}</p>`
            : ""
        }
      </div>

      ${actions}
    </header>
  `;
}
