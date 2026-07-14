import { NAV_ITEMS } from "../constants.js";
import { getUser } from "../auth/session.js";

const EXTRA_NAV_ITEMS = [
  {
    key: "achievements",
    label: "Achievements",
    icon: "award",
    href: "achievements.html"
  },
  {
    key: "calendar",
    label: "Calendar",
    icon: "calendar-days",
    href: "learning-calendar.html"
  },
  {
    key: "vocabulary-library",
    label: "Vocabulary Library",
    icon: "library-big",
    href: "vocabulary-library.html"
  },
  {
    key: "grammar-library",
    label: "Grammar Library",
    icon: "notebook-tabs",
    href: "grammar-library.html"
  }
];

function navLink(item, activeKey) {
  const isActive = item.key === activeKey;

  return `
    <a
      class="${isActive ? "active" : ""}"
      href="${item.href}"
      ${isActive ? 'aria-current="page"' : ""}
    >
      <i data-lucide="${item.icon}"></i>
      <span>${item.label}</span>
    </a>
  `;
}

export function sidebar(activeKey) {
  const user = getUser() || {};
  const allItems = [...NAV_ITEMS, ...EXTRA_NAV_ITEMS];

  return `
    <aside class="sidebar">
      <a class="brand" href="dashboard.html">
        <img
          src="../assets/images/logo/logo-mark.svg"
          alt="English Journey"
        >
        <strong>English Journey</strong>
      </a>

      <nav class="sidebar-nav">
        ${allItems
          .map((item) => navLink(item, activeKey))
          .join("")}
      </nav>

      <div class="sidebar-user">
        <img
          src="../assets/images/avatars/${user.avatar || "finka.svg"}"
          alt="${user.displayName || "Learner"}"
        >

        <div>
          <strong>${user.displayName || "Learner"}</strong>
          <small>Keep growing</small>
        </div>
      </div>
    </aside>
  `;
}