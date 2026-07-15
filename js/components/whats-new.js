const APP_VERSION = "1.0.4";

const RELEASE_NOTES = [
  "Meningkatkan tampilan pada perangkat mobile.",
  "Meningkatkan kecepatan submit Quiz.",
  "Menambahkan fitur ganti pin.",
  "Memperbaiki halaman utama."
];

function whatsNewMarkup() {
  return `
    <div
      class="whats-new-overlay"
      id="whats-new-overlay"
      aria-hidden="true"
    >
      <section
        class="whats-new-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="whats-new-title"
      >
        <button
          type="button"
          class="whats-new-close"
          id="whats-new-close"
          aria-label="Close What's New"
        >
          <i data-lucide="x"></i>
        </button>

        <div class="whats-new-icon">
          <i data-lucide="sparkles"></i>
        </div>

        <p class="whats-new-eyebrow">
          English Journey
        </p>

        <h2 id="whats-new-title">
          What’s New
        </h2>

        <span class="whats-new-version">
          Version ${APP_VERSION}
        </span>

        <ul class="whats-new-list">
          ${RELEASE_NOTES.map(
            (item) => `<li>${item}</li>`
          ).join("")}
        </ul>

        <button
          type="button"
          class="button primary whats-new-button"
          id="whats-new-continue"
        >
          Got it
        </button>
      </section>
    </div>
  `;
}

export function initWhatsNew() {
  const storageKey = "englishJourneySeenVersion";
  const seenVersion = localStorage.getItem(storageKey);

  if (seenVersion === APP_VERSION) {
    return;
  }

  document.body.insertAdjacentHTML(
    "beforeend",
    whatsNewMarkup()
  );

  const overlay = document.getElementById(
    "whats-new-overlay"
  );

  const closeButton = document.getElementById(
    "whats-new-close"
  );

  const continueButton = document.getElementById(
    "whats-new-continue"
  );

  function closeModal() {
    localStorage.setItem(storageKey, APP_VERSION);

    overlay?.classList.remove("open");
    document.body.classList.remove("modal-open");

    setTimeout(() => {
      overlay?.remove();
    }, 250);
  }

  requestAnimationFrame(() => {
    overlay?.classList.add("open");
    document.body.classList.add("modal-open");
  });

  closeButton?.addEventListener(
    "click",
    closeModal
  );

  continueButton?.addEventListener(
    "click",
    closeModal
  );

  overlay?.addEventListener(
    "click",
    (event) => {
      if (event.target === overlay) {
        closeModal();
      }
    }
  );

  document.addEventListener(
    "keydown",
    (event) => {
      if (event.key === "Escape") {
        closeModal();
      }
    },
    { once: true }
  );

  if (window.lucide) {
    window.lucide.createIcons();
  }
}
