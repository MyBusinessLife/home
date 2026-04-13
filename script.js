document.documentElement.classList.add("js-enabled");

const menuToggle = document.querySelector(".menu-toggle");
const siteNav = document.querySelector(".site-nav");
const navGroups = document.querySelectorAll(".nav-group");
const animatedItems = document.querySelectorAll("[data-animate]");

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
