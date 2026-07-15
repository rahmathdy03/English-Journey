const MAIN_MOBILE_ITEMS = [
  {
    key: "dashboard",
    label: "Dashboard",
    icon: "layout-grid",
    href: "dashboard.html"
  },
  {
    key: "learn",
    label: "Learn",
    icon: "book-open",
    href: "learning.html"
  },
  {
    key: "practice",
    label: "Practice",
    icon: "pencil",
    href: "practice.html"
  },
  {
    key: "progress",
    label: "Progress",
    icon: "chart-no-axes-column-increasing",
    href: "progress.html"
  },
  {
    key: "together",
    label: "Together",
    icon: "users",
    href: "compare-progress.html"
  }
];

const MORE_MOBILE_ITEMS = [
  {
    key: "profile",
    label: "Profile",
    icon: "user",
    href: "profile.html"
  },
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

function mainNavItem(item, activeKey) {
  const isActive = item.key === activeKey;

  return `
    <li>
      <a
        class="${isActive ? "active" : ""}"
        href="${item.href}"
        ${isActive ? 'aria-current="page"' : ""}
      >
        <i data-lucide="${item.icon}"></i>
        <span>${item.label}</span>
      </a>
    </li>
  `;
}

function moreNavItem(item, activeKey) {
  const isActive = item.key === activeKey;

  return `
    <a
      class="mobile-more-item ${isActive ? "active" : ""}"
      href="${item.href}"
      ${isActive ? 'aria-current="page"' : ""}
    >
      <span class="mobile-more-icon">
        <i data-lucide="${item.icon}"></i>
      </span>

      <span>${item.label}</span>
    </a>
  `;
}

export function mobileNav(activeKey) {
  const moreIsActive = MORE_MOBILE_ITEMS.some(
    (item) => item.key === activeKey
  );

  return `
    <nav class="mobile-nav" aria-label="Mobile navigation">
      <ul>
        ${MAIN_MOBILE_ITEMS
          .map((item) => mainNavItem(item, activeKey))
          .join("")}

        <li>
          <button
            type="button"
            class="mobile-more-button ${
              moreIsActive ? "active" : ""
            }"
            id="mobile-more-button"
            aria-label="Open more navigation"
            aria-controls="mobile-more-menu"
            aria-expanded="false"
          >
            <i data-lucide="menu"></i>
            <span>More</span>
          </button>
        </li>
      </ul>
    </nav>

    <div
      class="mobile-more-overlay"
      id="mobile-more-overlay"
      aria-hidden="true"
    ></div>

    <section
      class="mobile-more-menu"
      id="mobile-more-menu"
      aria-hidden="true"
      aria-label="More navigation"
    >
      <div class="mobile-more-header">
        <div>
          <span class="mobile-more-eyebrow">
            English Journey
          </span>
          <h2>More</h2>
        </div>

        <button
          type="button"
          class="mobile-more-close"
          id="mobile-more-close"
          aria-label="Close more navigation"
        >
          <i data-lucide="x"></i>
        </button>
      </div>

      <div class="mobile-more-grid">
        ${MORE_MOBILE_ITEMS
          .map((item) => moreNavItem(item, activeKey))
          .join("")}
      </div>
    </section>
  `;
}

export function initMobileNav() {
  const openButton = document.querySelector(
    "#mobile-more-button"
  );

  const closeButton = document.querySelector(
    "#mobile-more-close"
  );

  const menu = document.querySelector(
    "#mobile-more-menu"
  );

  const overlay = document.querySelector(
    "#mobile-more-overlay"
  );

  if (!openButton || !menu || !overlay) {
    return;
  }

  function openMenu() {
    menu.classList.add("open");
    overlay.classList.add("open");
    document.body.classList.add("mobile-menu-open");

    menu.setAttribute("aria-hidden", "false");
    overlay.setAttribute("aria-hidden", "false");
    openButton.setAttribute("aria-expanded", "true");

    closeButton?.focus();
  }

  function closeMenu() {
    menu.classList.remove("open");
    overlay.classList.remove("open");
    document.body.classList.remove("mobile-menu-open");

    menu.setAttribute("aria-hidden", "true");
    overlay.setAttribute("aria-hidden", "true");
    openButton.setAttribute("aria-expanded", "false");
  }

  openButton.addEventListener("click", openMenu);
  closeButton?.addEventListener("click", closeMenu);
  overlay.addEventListener("click", closeMenu);

  document.addEventListener("keydown", (event) => {
    if (
      event.key === "Escape" &&
      menu.classList.contains("open")
    ) {
      closeMenu();
    }
  });
}
