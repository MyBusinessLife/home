document.documentElement.classList.add("js-enabled");

const loaderStart = performance.now();
const shouldUsePageLoader = document.body && document.body.dataset.loader !== "off";

function getLoaderLogoSrc() {
  return (
    document.querySelector(".brand-mark img, .brand-badge img, .site-logo img")?.getAttribute("src") ||
    "assets/logo.png"
  );
}

function createPageLoader() {
  const loader = document.createElement("div");
  loader.className = "mbl-page-loader";
  loader.dataset.pageLoader = "";
  loader.setAttribute("aria-hidden", "false");
  loader.innerHTML = `
    <div class="loader-orbit">
      <span></span>
      <span></span>
      <span></span>
      <div class="loader-brand">
        <img src="${getLoaderLogoSrc()}" alt="" />
        <strong>MY BUSINESS LIFE</strong>
        <small>Préparation de l'expérience</small>
      </div>
    </div>
    <div class="loader-line"><span></span></div>
  `;
  document.body.prepend(loader);
  return loader;
}

const pageLoader =
  document.querySelector("[data-page-loader]") || (shouldUsePageLoader ? createPageLoader() : null);

if (pageLoader && shouldUsePageLoader) {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const minLoaderTime = reduceMotion ? 120 : 1250;
  const maxLoaderTime = reduceMotion ? 160 : 1900;
  let loaderHidden = false;

  document.body.classList.add("is-page-loading");

  const hideLoader = () => {
    if (loaderHidden) return;
    const elapsed = performance.now() - loaderStart;
    const delay = Math.max(0, minLoaderTime - elapsed);

    window.setTimeout(() => {
      loaderHidden = true;
      document.body.classList.remove("is-page-loading");
      pageLoader.setAttribute("aria-hidden", "true");
      window.setTimeout(() => pageLoader.remove(), reduceMotion ? 180 : 760);
    }, delay);
  };

  if (document.readyState === "complete") {
    hideLoader();
  } else {
    window.addEventListener("load", hideLoader, { once: true });
  }

  window.setTimeout(hideLoader, maxLoaderTime);
} else {
  document.body?.classList.remove("is-page-loading");
}

const menuToggle = document.querySelector(".menu-toggle");
const siteNav = document.querySelector(".site-nav");
const navGroups = document.querySelectorAll(".nav-group");
const animatedItems = document.querySelectorAll("[data-animate]");
const siteHeader = document.querySelector(".site-header");
const mainContent = document.querySelector("main");

const getFocusable = (root = document) =>
  Array.from(
    root.querySelectorAll(
      'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), summary, [tabindex]:not([tabindex="-1"])',
    ),
  ).filter((element) => {
    const style = window.getComputedStyle(element);
    return style.display !== "none" && style.visibility !== "hidden" && !element.hasAttribute("hidden");
  });

if (mainContent) {
  if (!mainContent.id) mainContent.id = "contenu-principal";
  mainContent.setAttribute("tabindex", "-1");

  if (!document.querySelector(".skip-link")) {
    const skipLink = document.createElement("a");
    skipLink.className = "skip-link";
    skipLink.href = `#${mainContent.id}`;
    skipLink.textContent = "Aller au contenu principal";
    document.body.prepend(skipLink);
    skipLink.addEventListener("click", () => {
      window.setTimeout(() => mainContent.focus({ preventScroll: true }), 0);
    });
  }
}

if (!document.querySelector("[data-a11y-announcer]")) {
  const announcer = document.createElement("div");
  announcer.className = "sr-only";
  announcer.dataset.a11yAnnouncer = "";
  announcer.setAttribute("role", "status");
  announcer.setAttribute("aria-live", "polite");
  announcer.setAttribute("aria-atomic", "true");
  document.body.appendChild(announcer);
}

const announce = (message) => {
  const announcer = document.querySelector("[data-a11y-announcer]");
  if (!announcer) return;
  announcer.textContent = "";
  window.setTimeout(() => {
    announcer.textContent = message;
  }, 30);
};

const normalizePageId = (value) => {
  if (!value) return "index";
  const clean = value.split("#")[0].split("?")[0].replace(/\/+$/, "");
  const last = clean.split("/").filter(Boolean).pop() || "index";
  return last.replace(/\.html$/, "") || "index";
};

const closeNavigation = () => {
  siteNav?.classList.remove("is-open");
  menuToggle?.setAttribute("aria-expanded", "false");
  navGroups.forEach((group) => {
    group.classList.remove("is-open");
    group.querySelector(".nav-menu-button")?.setAttribute("aria-expanded", "false");
  });
};

if (menuToggle && siteNav) {
  navGroups.forEach((group, index) => {
    const button = group.querySelector(".nav-menu-button");
    const dropdown = group.querySelector(".nav-dropdown");
    if (!button || !dropdown) return;

    const dropdownId = dropdown.id || `nav-submenu-${index + 1}`;
    dropdown.id = dropdownId;
    button.setAttribute("aria-controls", dropdownId);
    button.setAttribute("aria-haspopup", "true");
  });

  menuToggle.addEventListener("click", () => {
    const isOpen = siteNav.classList.toggle("is-open");
    menuToggle.setAttribute("aria-expanded", String(isOpen));
    announce(isOpen ? "Menu ouvert" : "Menu fermé");
  });

  siteNav.addEventListener("click", (event) => {
    const menuButton = event.target.closest(".nav-menu-button");

    if (menuButton) {
      const group = menuButton.closest(".nav-group");
      const isOpen = group.classList.toggle("is-open");
      menuButton.setAttribute("aria-expanded", String(isOpen));
      announce(isOpen ? "Sous-menu ouvert" : "Sous-menu fermé");
      return;
    }

    if (event.target.closest("a")) {
      closeNavigation();
    }
  });

  document.addEventListener("click", (event) => {
    if (!event.target.closest(".site-header")) {
      closeNavigation();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      if (document.querySelector("[data-mbl-privacy-panel].is-visible")) return;
      closeNavigation();
      menuToggle.focus();
      announce("Menu fermé");
      return;
    }

    if (event.key === "ArrowDown") {
      const button = event.target.closest(".nav-menu-button");
      if (!button) return;
      const group = button.closest(".nav-group");
      const firstLink = group?.querySelector(".nav-dropdown a");
      group?.classList.add("is-open");
      button.setAttribute("aria-expanded", "true");
      firstLink?.focus();
    }
  });
}

if (siteNav) {
  const currentPage = normalizePageId(window.location.pathname);

  siteNav.querySelectorAll("a[href]").forEach((link) => {
    const href = link.getAttribute("href");
    if (!href || href.startsWith("http") || href.startsWith("mailto:") || href.startsWith("#")) return;

    const linkPage = normalizePageId(new URL(href, window.location.href).pathname);
    const isCurrent = linkPage === currentPage || (currentPage === "" && linkPage === "index");

    if (isCurrent) {
      link.setAttribute("aria-current", "page");
      link.closest(".nav-group")?.classList.add("is-current");
    } else if (link.getAttribute("aria-current") === "page") {
      link.removeAttribute("aria-current");
    }
  });
}

if (siteHeader) {
  const updateHeaderState = () => {
    siteHeader.classList.toggle("is-scrolled", window.scrollY > 12);
  };

  updateHeaderState();
  window.addEventListener("scroll", updateHeaderState, { passive: true });
}

if ("IntersectionObserver" in window) {
  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        revealObserver.unobserve(entry.target);
      });
    },
    { threshold: 0.14, rootMargin: "0px 0px -8% 0px" }
  );

  animatedItems.forEach((item) => revealObserver.observe(item));
} else {
  animatedItems.forEach((item) => item.classList.add("is-visible"));
}

document.querySelectorAll("details").forEach((item) => {
  item.addEventListener("toggle", () => {
    if (!item.open) return;
    document.querySelectorAll("details").forEach((other) => {
      if (other !== item) other.removeAttribute("open");
    });
  });
});

document.querySelectorAll("[data-spotlight]").forEach((card) => {
  card.addEventListener("pointermove", (event) => {
    const rect = card.getBoundingClientRect();
    const x = Math.round(((event.clientX - rect.left) / rect.width) * 100);
    const y = Math.round(((event.clientY - rect.top) / rect.height) * 100);
    card.style.setProperty("--mx", `${x}%`);
    card.style.setProperty("--my", `${y}%`);
    card.style.setProperty("--tilt-x", `${((event.clientY - rect.top) / rect.height - 0.5) * -3}deg`);
    card.style.setProperty("--tilt-y", `${((event.clientX - rect.left) / rect.width - 0.5) * 3}deg`);
  });

  card.addEventListener("pointerleave", () => {
    card.style.removeProperty("--tilt-x");
    card.style.removeProperty("--tilt-y");
  });
});

document.querySelectorAll(".button").forEach((button) => {
  button.addEventListener("pointermove", (event) => {
    const rect = button.getBoundingClientRect();
    button.style.setProperty("--button-x", `${event.clientX - rect.left}px`);
    button.style.setProperty("--button-y", `${event.clientY - rect.top}px`);
  });
});

const stagePresets = {
  presence: {
    title: "Plan digital",
    copy: "Priorités, actions, résultats",
    insight: "Clarifier la présence, puis convertir.",
    primary: "Présence claire",
    secondary: "Image plus crédible",
    tertiary: "Visites mieux qualifiées",
    hint: "Une base premium pour mieux présenter, rassurer et convertir.",
    linkHref: "developpement-web.html",
    linkLabel: "Voir le service",
  },
  automation: {
    title: "Automatisations utiles",
    copy: "Relances, exports, alertes, synchronisations",
    insight: "Enlever les tâches répétitives sans perdre le contrôle.",
    primary: "Flux reliés",
    secondary: "Moins de tâches manuelles",
    tertiary: "Temps rendu à l'équipe",
    hint: "Des scénarios propres, visibles et faciles à faire évoluer.",
    linkHref: "automatisation.html",
    linkLabel: "Voir l'automatisation",
  },
  pilotage: {
    title: "Pilotage métier",
    copy: "Données, tableaux de bord, décisions",
    insight: "Voir les bons indicateurs pour agir plus vite.",
    primary: "Dashboard métier",
    secondary: "Alertes plus rapides",
    tertiary: "Décisions mieux cadrées",
    hint: "Les données utiles remontent dans une interface qui reste lisible.",
    linkHref: "logiciel-sur-mesure.html",
    linkLabel: "Voir le pilotage",
  },
};

document.querySelectorAll("[data-stage-panel]").forEach((panel) => {
  const controls = Array.from(panel.querySelectorAll("[data-stage-control]"));
  const title = panel.querySelector("[data-stage-title]");
  const copy = panel.querySelector("[data-stage-copy]");
  const insight = panel.querySelector("[data-stage-insight] strong");
  const primary = panel.querySelector("[data-stage-chip-primary]");
  const secondary = panel.querySelector("[data-stage-chip-secondary]");
  const tertiary = panel.querySelector("[data-stage-chip-tertiary]");
  const hint = panel.querySelector("[data-stage-board-hint]");
  const link = panel.querySelector("[data-stage-board-link]");
  let activeKey = controls.find((control) => control.classList.contains("is-active"))?.dataset.stageControl || "presence";
  let switchTimer;

  const syncStageCopy = (key) => {
    const preset = stagePresets[key];
    if (!preset) return;

    if (title) title.textContent = preset.title;
    if (copy) copy.textContent = preset.copy;
    if (insight) insight.textContent = preset.insight;
    if (primary) primary.textContent = preset.primary;
    if (secondary) secondary.textContent = preset.secondary;
    if (tertiary) tertiary.textContent = preset.tertiary;
    if (hint) hint.textContent = preset.hint;
    if (link) {
      link.href = preset.linkHref;
      link.textContent = preset.linkLabel;
    }

    panel.dispatchEvent(
      new CustomEvent("mbl:stage-change", {
        bubbles: false,
        detail: { key, preset },
      }),
    );
  };

  const activateStage = (key) => {
    const preset = stagePresets[key];
    if (!preset || key === activeKey) return;

    activeKey = key;
    panel.dataset.stageActive = key;
    panel.classList.add("is-switching");
    window.clearTimeout(switchTimer);

    controls.forEach((control) => {
      control.classList.toggle("is-active", control.dataset.stageControl === key);
    });

    switchTimer = window.setTimeout(() => {
      syncStageCopy(key);
      panel.classList.remove("is-switching");
    }, 120);
  };

  panel.dataset.stageActive = activeKey;
  syncStageCopy(activeKey);
  panel.addEventListener("mbl:stage-request", (event) => {
    if (!event.detail?.key) return;
    activateStage(event.detail.key);
  });

  controls.forEach((control) => {
    control.addEventListener("pointermove", (event) => {
      const rect = control.getBoundingClientRect();
      control.style.setProperty("--kpi-x", `${Math.round(((event.clientX - rect.left) / rect.width) * 100)}%`);
      control.style.setProperty("--kpi-y", `${Math.round(((event.clientY - rect.top) / rect.height) * 100)}%`);
    });

    control.addEventListener("pointerenter", () => activateStage(control.dataset.stageControl));
    control.addEventListener("focus", () => activateStage(control.dataset.stageControl));
  });
});

const cookieConsentKey = "mbl_cookie_consent_v3";
let privacyReturnFocus = null;

const readCookieConsent = () => {
  try {
    const raw = window.localStorage.getItem(cookieConsentKey);
    return raw ? JSON.parse(raw) : null;
  } catch (error) {
    return null;
  }
};

const applyCookieConsent = (consent) => {
  window.mblConsent = {
    essential: true,
    analytics: Boolean(consent?.analytics),
    marketing: Boolean(consent?.marketing),
    savedAt: consent?.savedAt || null,
  };

  document.documentElement.dataset.cookiesAnalytics = window.mblConsent.analytics ? "granted" : "denied";
  document.documentElement.dataset.cookiesMarketing = window.mblConsent.marketing ? "granted" : "denied";
  window.dispatchEvent(new CustomEvent("mbl:cookie-consent", { detail: window.mblConsent }));
};

const saveCookieConsent = (settings) => {
  const consent = {
    version: 3,
    essential: true,
    analytics: Boolean(settings.analytics),
    marketing: Boolean(settings.marketing),
    savedAt: new Date().toISOString(),
  };

  try {
    window.localStorage.setItem(cookieConsentKey, JSON.stringify(consent));
  } catch (error) {
    // Consent is still applied for the current session if storage is unavailable.
  }

  applyCookieConsent(consent);
  document.querySelector("[data-mbl-privacy-panel]")?.remove();
  updateCookiePreferencesButton();
  if (privacyReturnFocus?.isConnected) {
    privacyReturnFocus.focus();
  } else {
    document.querySelector("[data-mbl-privacy-floating]")?.focus?.();
  }
  privacyReturnFocus = null;
};

function updateCookiePreferencesButton() {
  if (!document.body) return;

  let button = document.querySelector("[data-mbl-privacy-floating]");
  const hasBanner = Boolean(document.querySelector("[data-mbl-privacy-panel]"));
  const shouldShow = Boolean(readCookieConsent()) && !hasBanner;

  if (!button) {
    button = document.createElement("button");
    button.type = "button";
    button.className = "mbl-privacy-floating";
    button.dataset.mblPrivacyTrigger = "";
    button.dataset.mblPrivacyFloating = "";
    button.setAttribute("aria-label", "Modifier les préférences de confidentialité");
    button.textContent = "Confidentialité";
    document.body.appendChild(button);
  }

  button.hidden = !shouldShow;
}

const renderCookieConsent = (forceOpen = false) => {
  const existing = document.querySelector("[data-mbl-privacy-panel]");
  if (existing) {
    existing.hidden = false;
    existing.classList.add("is-visible");
    updateCookiePreferencesButton();
    getFocusable(existing)[0]?.focus();
    return;
  }

  const stored = readCookieConsent();
  if (stored && !forceOpen) {
    applyCookieConsent(stored);
    updateCookiePreferencesButton();
    return;
  }

  const current = stored || { analytics: false, marketing: false };
  privacyReturnFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  const banner = document.createElement("section");
  banner.className = "mbl-privacy-layer";
  banner.dataset.mblPrivacyPanel = "";
  banner.setAttribute("role", "dialog");
  banner.setAttribute("aria-modal", "true");
  banner.setAttribute("aria-labelledby", "mbl-privacy-title");
  banner.setAttribute("aria-describedby", "mbl-privacy-description");
  banner.innerHTML = `
    <div class="mbl-privacy-panel">
      <div class="mbl-privacy-orbit" aria-hidden="true"><span></span><span></span><span></span></div>
      <p class="mbl-privacy-kicker">Confidentialité MY BUSINESS LIFE</p>
      <h2 id="mbl-privacy-title">Améliorer l'expérience, uniquement avec votre accord.</h2>
      <p id="mbl-privacy-description">Nous utilisons les cookies nécessaires au fonctionnement du site. La mesure d'audience et le marketing ne sont activés que si vous les acceptez.</p>
      <div class="mbl-privacy-actions is-primary">
        <button class="button button-primary" type="button" data-mbl-privacy-accept>Tout accepter</button>
        <button class="button button-secondary" type="button" data-mbl-privacy-manage>Gérer mes choix</button>
      </div>
      <div class="mbl-privacy-choices" hidden>
        <div class="mbl-privacy-options">
          <label class="mbl-privacy-card">
            <span class="mbl-privacy-switch"><strong>Nécessaires</strong><input type="checkbox" checked disabled /></span>
            <small>Indispensables au fonctionnement du site et à la sécurité.</small>
          </label>
          <label class="mbl-privacy-card">
            <span class="mbl-privacy-switch"><strong>Mesure d'audience</strong><input type="checkbox" data-mbl-privacy-toggle="analytics" ${current.analytics ? "checked" : ""} /></span>
            <small>Aide à comprendre les pages consultées et à améliorer l'expérience.</small>
          </label>
          <label class="mbl-privacy-card">
            <span class="mbl-privacy-switch"><strong>Marketing</strong><input type="checkbox" data-mbl-privacy-toggle="marketing" ${current.marketing ? "checked" : ""} /></span>
            <small>Permet de mesurer les campagnes publicitaires si elles sont activées.</small>
          </label>
        </div>
        <div class="mbl-privacy-actions">
          <button class="button button-secondary" type="button" data-mbl-privacy-reject>Tout refuser</button>
          <button class="button button-primary" type="button" data-mbl-privacy-save>Enregistrer mes choix</button>
        </div>
      </div>
      <div class="mbl-privacy-links">
        <a href="cookies.html">Politique cookies</a>
        <a href="confidentialite.html">Confidentialité</a>
      </div>
    </div>
  `;

  document.body.appendChild(banner);
  updateCookiePreferencesButton();
  window.requestAnimationFrame(() => {
    banner.classList.add("is-visible");
    banner.querySelector("[data-mbl-privacy-accept]")?.focus();
  });

  banner.addEventListener("keydown", (event) => {
    if (event.key !== "Tab") return;

    const focusable = getFocusable(banner);
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (!first || !last) return;

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  });

  banner.querySelector("[data-mbl-privacy-manage]")?.addEventListener("click", () => {
    banner.querySelector(".mbl-privacy-choices")?.removeAttribute("hidden");
    banner.querySelector(".mbl-privacy-actions.is-primary")?.classList.add("is-subtle");
    banner.querySelector("[data-mbl-privacy-toggle]")?.focus();
  });

  banner.querySelector("[data-mbl-privacy-reject]")?.addEventListener("click", () => {
    saveCookieConsent({ analytics: false, marketing: false });
  });

  banner.querySelector("[data-mbl-privacy-accept]")?.addEventListener("click", () => {
    saveCookieConsent({ analytics: true, marketing: true });
  });

  banner.querySelector("[data-mbl-privacy-save]")?.addEventListener("click", () => {
    saveCookieConsent({
      analytics: banner.querySelector('[data-mbl-privacy-toggle="analytics"]')?.checked,
      marketing: banner.querySelector('[data-mbl-privacy-toggle="marketing"]')?.checked,
    });
  });
};

applyCookieConsent(readCookieConsent());

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => renderCookieConsent(false), { once: true });
} else {
  renderCookieConsent(false);
}

window.setTimeout(() => {
  if (!readCookieConsent() && !document.querySelector("[data-mbl-privacy-panel]")) {
    renderCookieConsent(false);
  } else {
    updateCookiePreferencesButton();
  }
}, 1700);

document.addEventListener("click", (event) => {
  const trigger = event.target.closest("[data-mbl-privacy-trigger], [data-cookie-preferences]");
  if (!trigger) return;
  event.preventDefault();
  renderCookieConsent(true);
});

document.querySelectorAll(".footer-bottom").forEach((footerBottom) => {
  if (footerBottom.querySelector("[data-mbl-privacy-trigger]")) return;
  const target = footerBottom.querySelector("span:last-child") || footerBottom;
  const separator = document.createTextNode(" · ");
  const button = document.createElement("button");
  button.type = "button";
  button.className = "mbl-privacy-footer-link";
  button.dataset.mblPrivacyTrigger = "";
  button.textContent = "Préférences confidentialité";
  target.append(separator, button);
});

document.addEventListener("click", (event) => {
  const target = event.target.closest("a.button, button.button, .nav-cta, .card-link");
  if (!target) return;

  const label = (target.textContent || "").replace(/\s+/g, " ").trim().slice(0, 120);
  const destination = target.getAttribute("href") || target.dataset.action || "";

  window.MBLData?.trackGoogleEvent?.("select_content", {
    content_type: "cta",
    item_id: label || destination || "cta",
    link_url: destination,
  });

  const trackingPromise = window.MBLData?.trackEvent?.("cta_click", {
    label,
    destination,
  });
  trackingPromise?.catch?.(() => {});
});

document.querySelectorAll("[data-intake-form]").forEach((form) => {
  const status = form.querySelector("[data-form-status]");

  form.addEventListener("submit", async (event) => {
    event.preventDefault();

    const formData = new FormData(form);
    const payload = {
      source: form.getAttribute("data-source") || "site-vitrine",
      page: document.title,
      submittedAt: new Date().toISOString(),
      ...(window.MBLData?.pageContext?.() || { page_path: window.location.pathname }),
      ...Object.fromEntries(formData.entries()),
    };
    const endpoint = form.getAttribute("data-endpoint") || "/api/contact";

    if (status) status.textContent = "Envoi de votre demande...";

    try {
      const dataResult = window.MBLData?.submitContact
        ? await window.MBLData.submitContact(payload)
        : { ok: false, skipped: true };

      if (!dataResult?.ok) {
        const response = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!response.ok) throw new Error("Request failed");
      }

      form.reset();
      if (status) status.textContent = "Demande reçue. Nous revenons vers vous rapidement.";
    } catch (error) {
      const subject = encodeURIComponent("Demande depuis le site MY BUSINESS LIFE");
      const body = encodeURIComponent(
        Object.entries(payload)
          .map(([key, value]) => `${key}: ${value}`)
          .join("\n"),
      );

      if (status) {
        status.textContent =
          "Le serveur de formulaire n'est pas encore connecté ici. Votre email va s'ouvrir avec la demande préparée.";
      }

      window.setTimeout(() => {
        window.location.href = `mailto:contact@mybusinesslife.fr?subject=${subject}&body=${body}`;
      }, 450);
    }
  });
});

document.querySelectorAll("[data-staircase]").forEach((section) => {
  const progressBar = section.querySelector("[data-stair-progress]");
  const steps = Array.from(section.querySelectorAll("[data-step]"));
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let ticking = false;
  let lastIndex = -1;

  const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

  const updateStaircase = () => {
    ticking = false;

    const rect = section.getBoundingClientRect();
    const viewport = window.innerHeight || document.documentElement.clientHeight;
    const raw = 1 - (rect.top + rect.height * 0.16) / (viewport + rect.height * 0.48);
    const progress = reduceMotion ? 1 : clamp(raw, 0, 1);
    const eased = 1 - Math.pow(1 - progress, 2.2);
    const activeIndex = clamp(Math.floor(eased * steps.length), 0, steps.length - 1);

    section.style.setProperty("--person-left", `${16 + eased * 68}%`);
    section.style.setProperty("--person-bottom", `${18 + eased * 58}%`);
    section.style.setProperty("--person-tilt", `${-3 + eased * 7}deg`);
    section.style.setProperty("--stair-progress-width", `${Math.round(eased * 100)}%`);
    section.classList.toggle("is-moving", progress > 0.03 && progress < 0.98);

    steps.forEach((step, index) => {
      step.classList.toggle("is-active", index <= activeIndex);
    });

    if (activeIndex !== lastIndex) {
      lastIndex = activeIndex;
      progressBar?.setAttribute("aria-valuenow", String(Math.round(eased * 100)));
    }
  };

  const requestUpdate = () => {
    if (ticking) return;
    ticking = true;
    window.requestAnimationFrame(updateStaircase);
  };

  progressBar?.setAttribute("role", "progressbar");
  progressBar?.setAttribute("aria-label", "Progression vers l'automatisation");
  progressBar?.setAttribute("aria-valuemin", "0");
  progressBar?.setAttribute("aria-valuemax", "100");

  updateStaircase();
  window.addEventListener("scroll", requestUpdate, { passive: true });
  window.addEventListener("resize", requestUpdate);
});

/* ═══════════════════════════════════════════════════
   ULTRA PREMIUM INTERACTIVE ENHANCEMENTS — MBL 2026
   ═══════════════════════════════════════════════════ */

(function () {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ── 1. Cursor glow ── */
  if (!reduceMotion && window.innerWidth > 768) {
    const glow = document.createElement('div');
    glow.className = 'mbl-cursor-glow';
    document.body.appendChild(glow);
    let mouseX = -999, mouseY = -999;
    let glowX = -999, glowY = -999;

    document.addEventListener('mousemove', (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    }, { passive: true });

    const tickGlow = () => {
      glowX += (mouseX - glowX) * 0.1;
      glowY += (mouseY - glowY) * 0.1;
      glow.style.left = glowX + 'px';
      glow.style.top = glowY + 'px';
      requestAnimationFrame(tickGlow);
    };
    requestAnimationFrame(tickGlow);
  }

  /* ── 2. Aurora orbs in hero section ── */
  if (!reduceMotion) {
    const hero = document.querySelector('.hero-section');
    if (hero) {
      hero.style.position = 'relative';
      ['mbl-aurora mbl-aurora-a', 'mbl-aurora mbl-aurora-b', 'mbl-aurora mbl-aurora-c'].forEach((cls) => {
        const orb = document.createElement('div');
        cls.split(' ').forEach(c => orb.classList.add(c));
        orb.setAttribute('aria-hidden', 'true');
        hero.prepend(orb);
      });
    }
  }

  /* ── 3. Spotlight on profile & solution cards ── */
  document.querySelectorAll('.profile-card, .solution-card, .outcome-grid > div').forEach((card) => {
    card.addEventListener('pointermove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = Math.round(((e.clientX - rect.left) / rect.width) * 100);
      const y = Math.round(((e.clientY - rect.top) / rect.height) * 100);
      card.style.setProperty('--mx', x + '%');
      card.style.setProperty('--my', y + '%');
    }, { passive: true });
  });

  /* ── 4. Magnetic buttons ── */
  if (!reduceMotion && window.innerWidth > 768) {
    document.querySelectorAll('.button-primary, .button-secondary').forEach((btn) => {
      const strength = 0.28;

      btn.addEventListener('mousemove', (e) => {
        const rect = btn.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        const dx = (e.clientX - cx) * strength;
        const dy = (e.clientY - cy) * strength;
        btn.style.transform = `translate(${dx}px, ${dy}px) translateY(-2px)`;
      });

      btn.addEventListener('mouseleave', () => {
        btn.style.transform = '';
      });
    });
  }

  /* ── 5. Animated counter on outcome-grid ── */
  const outcomeNums = document.querySelectorAll('.outcome-grid strong');
  if (outcomeNums.length) {
    const animCount = (el) => {
      const text = el.textContent.trim();
      const words = ['Clarté', 'Crédibilité', 'Temps', 'Évolution'];
      if (words.includes(text)) return; // text words, skip
      const num = parseFloat(text.replace(/[^0-9.]/g, ''));
      if (isNaN(num)) return;
      const suffix = text.replace(/[0-9.]+/, '').trim();
      const start = performance.now();
      const dur = 1600;
      const tick = (now) => {
        const t = Math.min((now - start) / dur, 1);
        const ease = 1 - Math.pow(1 - t, 3);
        el.textContent = Math.round(ease * num) + suffix;
        if (t < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    };

    const counterObs = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting && !e.target.dataset.counted) {
          e.target.dataset.counted = '1';
          e.target.querySelectorAll('strong').forEach(animCount);
        }
      });
    }, { threshold: 0.3 });

    document.querySelectorAll('.outcome-grid > div').forEach((el) => counterObs.observe(el));
  }

  /* ── 6. Enhanced 3D tilt for stage shell (mouse parallax) ── */
  const productStage = document.querySelector('.product-stage');
  if (productStage && !reduceMotion) {
    const shell = productStage.querySelector('.stage-shell');
    if (shell) {
      let tiltX = 0, tiltY = 0, targetX = 0, targetY = 0;
      let isHovered = false;
      const MAX_TILT = 3;

      productStage.addEventListener('mousemove', (e) => {
        isHovered = true;
        const rect = productStage.getBoundingClientRect();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        targetY = ((e.clientX - cx) / (rect.width / 2)) * MAX_TILT;
        targetX = -((e.clientY - cy) / (rect.height / 2)) * MAX_TILT;
      }, { passive: true });

      productStage.addEventListener('mouseleave', () => {
        isHovered = false;
        targetX = 0;
        targetY = 0;
      });

      const tickTilt = () => {
        tiltX += (targetX - tiltX) * 0.07;
        tiltY += (targetY - tiltY) * 0.07;
        const nearZero = Math.abs(tiltX) < 0.05 && Math.abs(tiltY) < 0.05;
        if (isHovered || !nearZero) {
          shell.style.transform = `perspective(1000px) rotateX(${tiltX.toFixed(3)}deg) rotateY(${tiltY.toFixed(3)}deg)`;
        } else {
          shell.style.transform = '';
        }
        requestAnimationFrame(tickTilt);
      };
      requestAnimationFrame(tickTilt);
    }
  }

  /* ── 7. Scroll-triggered gradient separator lines ── */
  const sections = document.querySelectorAll(
    '.profile-section, .solutions-section, .outcome-section, .diagnostic-section, .resource-section'
  );
  if (sections.length) {
    const sepObs = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          e.target.classList.add('section-in-view');
        }
      });
    }, { threshold: 0.05 });
    sections.forEach((s) => sepObs.observe(s));
  }

})();
