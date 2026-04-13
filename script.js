const PRODUCTION_DOMAIN = "https://mybusinesslife.fr";
const SOURCE_ROUTE_MAP = Object.freeze({
  "/home/": "/",
  "/home/index.html": "/",
  "/home/contact.html": "/contact",
  "/home/a-propos.html": "/a-propos",
  "/home/particuliers.html": "/particuliers",
  "/home/professionnels.html": "/professionnels",
  "/home/services/developpement-web.html": "/services/developpement-web",
  "/home/services/developpement-logiciel.html": "/services/developpement-logiciel",
  "/home/services/reparation-ordinateur.html": "/services/reparation-ordinateur",
  "/home/services/automatisation.html": "/services/automatisation",
  "/home/services/strategie-digitale.html": "/services/strategie-digitale",
  "/home/blog/": "/blog",
  "/home/blog/index.html": "/blog",
  "/home/blog/diagnostic-digital.html": "/blog/diagnostic-digital",
  "/home/blog/site-web-qui-convertit.html": "/blog/site-web-qui-convertit",
  "/home/blog/logiciel-sur-mesure.html": "/blog/logiciel-sur-mesure",
  "/home/mentions-legales.html": "/mentions-legales",
  "/home/politique-confidentialite.html": "/politique-confidentialite",
  "/home/politique-cookies.html": "/politique-cookies",
  "/home/conditions-utilisation.html": "/conditions-utilisation"
});

if (window.location.hostname === "mybusinesslife.github.io") {
  const productionPath = SOURCE_ROUTE_MAP[window.location.pathname];

  if (productionPath) {
    window.location.replace(`${PRODUCTION_DOMAIN}${productionPath}${window.location.hash}`);
  }
}

document.documentElement.classList.add("js-enabled");

const menuToggle = document.querySelector(".menu-toggle");
const siteNav = document.querySelector(".site-nav");
const navGroups = document.querySelectorAll(".nav-group");
const animatedItems = document.querySelectorAll("[data-animate]");
const tiltCards = document.querySelectorAll(".tilt-card");
const contactForm = document.querySelector("[data-contact-form]");

const closeNavigation = () => {
  siteNav?.classList.remove("is-open");
  menuToggle?.setAttribute("aria-expanded", "false");
  navGroups.forEach((group) => {
    group.classList.remove("is-open");
    group.querySelector(".nav-menu-button")?.setAttribute("aria-expanded", "false");
  });
};

if (menuToggle && siteNav) {
  menuToggle.addEventListener("click", () => {
    const isOpen = siteNav.classList.toggle("is-open");
    menuToggle.setAttribute("aria-expanded", String(isOpen));
  });

  siteNav.addEventListener("click", (event) => {
    const menuButton = event.target.closest(".nav-menu-button");

    if (menuButton) {
      const group = menuButton.closest(".nav-group");
      const isOpen = group.classList.toggle("is-open");
      menuButton.setAttribute("aria-expanded", String(isOpen));
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
      closeNavigation();
    }
  });
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

tiltCards.forEach((card) => {
  card.addEventListener("pointermove", (event) => {
    const rect = card.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width - 0.5;
    const y = (event.clientY - rect.top) / rect.height - 0.5;
    card.style.setProperty("--tilt-x", `${x * 4}deg`);
    card.style.setProperty("--tilt-y", `${y * -4}deg`);
  });

  card.addEventListener("pointerleave", () => {
    card.style.setProperty("--tilt-x", "0deg");
    card.style.setProperty("--tilt-y", "0deg");
  });
});

if (contactForm) {
  contactForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const data = new FormData(contactForm);
    const name = data.get("name") || "";
    const email = data.get("email") || "";
    const profile = data.get("profile") || "";
    const topic = data.get("topic") || "";
    const message = data.get("message") || "";
    const subject = encodeURIComponent(`Demande MBL - ${topic}`);
    const body = encodeURIComponent(
      `Nom : ${name}\nEmail : ${email}\nProfil : ${profile}\nSujet : ${topic}\n\nMessage :\n${message}`
    );
    const status = contactForm.querySelector("[data-form-status]");

    window.location.href = `mailto:contact@mybusinesslife.fr?subject=${subject}&body=${body}`;
    if (status) {
      status.textContent = "Votre application email va s’ouvrir avec le message préparé.";
    }
  });
}
