(function () {
  "use strict";

  const DEFAULT_SITE_BASE = "https://mybusinesslife.fr";
  const HOME_SOURCE_BASE = "https://mybusinesslife.github.io/home/";
  const EBOOK_SOURCE_BASE = "https://mybusinesslife.github.io/mbl-ebook-lead-magnet/";
  const STYLE_VERSION = "15";
  const SCRIPT_VERSION = "15";

  const pages = Object.freeze({
    home: { path: "index.html", route: "/" },
    contact: { path: "contact.html", route: "/contact" },
    diagnostic: { path: "diagnostic.html", route: "/diagnostic" },
    "a-propos": { path: "a-propos.html", route: "/a-propos" },
    particuliers: { path: "particuliers.html", route: "/particuliers" },
    professionnels: { path: "professionnels.html", route: "/professionnels" },
    "developpement-web": {
      path: "services/developpement-web.html",
      route: "/services/developpement-web"
    },
    "developpement-logiciel": {
      path: "services/developpement-logiciel.html",
      route: "/services/developpement-logiciel"
    },
    "reparation-ordinateur": {
      path: "services/reparation-ordinateur.html",
      route: "/services/reparation-ordinateur"
    },
    automatisation: { path: "services/automatisation.html", route: "/services/automatisation" },
    "strategie-digitale": {
      path: "services/strategie-digitale.html",
      route: "/services/strategie-digitale"
    },
    blog: { path: "blog/index.html", route: "/blog" },
    "blog-diagnostic-digital": {
      path: "blog/diagnostic-digital.html",
      route: "/blog/diagnostic-digital"
    },
    "blog-site-web-qui-convertit": {
      path: "blog/site-web-qui-convertit.html",
      route: "/blog/site-web-qui-convertit"
    },
    "blog-logiciel-sur-mesure": {
      path: "blog/logiciel-sur-mesure.html",
      route: "/blog/logiciel-sur-mesure"
    },
    "mentions-legales": { path: "mentions-legales.html", route: "/mentions-legales" },
    "politique-confidentialite": {
      path: "politique-confidentialite.html",
      route: "/politique-confidentialite"
    },
    "politique-cookies": { path: "politique-cookies.html", route: "/politique-cookies" },
    "conditions-utilisation": {
      path: "conditions-utilisation.html",
      route: "/conditions-utilisation"
    },
    ebook: {
      path: "index.html",
      route: "/ebook",
      sourceBase: EBOOK_SOURCE_BASE,
      stylesheet: "ebook.css?v=7",
      scripts: [
        "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js",
        "ebook.js?v=7"
      ]
    }
  });

  const pathToRoute = Object.freeze(
    Object.values(pages).reduce((accumulator, page) => {
      if (page.sourceBase === EBOOK_SOURCE_BASE) return accumulator;
      accumulator[`/home/${page.path}`] = page.route;
      return accumulator;
    }, { "/home/": "/", "/home/index.html": "/", "/home/blog/": "/blog" })
  );

  const ensureSlashlessBase = (value) => String(value || "").replace(/\/+$/, "");
  const isExternalProtocol = (value) => /^(mailto:|tel:|sms:|javascript:)/i.test(value);

  const ensureStyles = (href) => {
    if ([...document.styleSheets].some((sheet) => sheet.href === href)) return;

    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = href;
    document.head.appendChild(link);
  };

  const ensureScript = (src) =>
    new Promise((resolve, reject) => {
      if ([...document.scripts].some((script) => script.src === src)) {
        resolve();
        return;
      }

      const script = document.createElement("script");
      script.src = src;
      script.defer = true;
      script.onload = resolve;
      script.onerror = () => reject(new Error(`Impossible de charger ${src}`));
      document.body.appendChild(script);
    });

  const makeAbsoluteAsset = (value, pageUrl) => {
    if (!value || value.startsWith("data:") || value.startsWith("blob:") || value.startsWith("#")) {
      return value;
    }

    try {
      return new URL(value, pageUrl).href;
    } catch (_error) {
      return value;
    }
  };

  const rewriteSrcset = (value, pageUrl) =>
    value
      .split(",")
      .map((part) => {
        const tokens = part.trim().split(/\s+/);
        if (!tokens[0]) return part;
        tokens[0] = makeAbsoluteAsset(tokens[0], pageUrl);
        return tokens.join(" ");
      })
      .join(", ");

  const rewriteLinks = (root, pageUrl, siteBase) => {
    root.querySelectorAll("a[href]").forEach((link) => {
      const originalHref = link.getAttribute("href");
      if (!originalHref || originalHref.startsWith("#") || isExternalProtocol(originalHref)) return;

      let resolvedUrl;
      try {
        resolvedUrl = new URL(originalHref, pageUrl);
      } catch (_error) {
        return;
      }

      if (resolvedUrl.hostname === "mybusinesslife.github.io") {
        if (resolvedUrl.pathname.startsWith("/mbl-ebook-lead-magnet")) {
          link.href = `${siteBase}/ebook${resolvedUrl.hash}`;
          return;
        }

        const productionRoute = pathToRoute[resolvedUrl.pathname] || pathToRoute[`${resolvedUrl.pathname}/`];
        if (productionRoute) {
          link.href = `${siteBase}${productionRoute}${resolvedUrl.search}${resolvedUrl.hash}`;
        }
      }
    });
  };

  const rewriteAssets = (root, pageUrl) => {
    root.querySelectorAll("[src]").forEach((element) => {
      element.setAttribute("src", makeAbsoluteAsset(element.getAttribute("src"), pageUrl));
    });

    root.querySelectorAll("[srcset]").forEach((element) => {
      element.setAttribute("srcset", rewriteSrcset(element.getAttribute("srcset"), pageUrl));
    });
  };

  const syncMeta = (doc, page, siteBase) => {
    document.title = doc.title || document.title;

    const description = doc.querySelector('meta[name="description"]')?.getAttribute("content");
    const canonical = `${siteBase}${page.route}`;
    const metaDescription =
      document.querySelector('meta[name="description"]') ||
      document.head.appendChild(Object.assign(document.createElement("meta"), { name: "description" }));
    const canonicalLink =
      document.querySelector('link[rel="canonical"]') ||
      document.head.appendChild(Object.assign(document.createElement("link"), { rel: "canonical" }));

    if (description) metaDescription.setAttribute("content", description);
    canonicalLink.setAttribute("href", canonical);

    const robots =
      document.querySelector('meta[name="robots"]') ||
      document.head.appendChild(Object.assign(document.createElement("meta"), { name: "robots" }));
    robots.setAttribute("content", "index, follow");
  };

  const showStatus = (target, message, isError) => {
    target.innerHTML = "";
    const status = document.createElement("div");
    status.className = "mbl-loader-status";
    status.textContent = message;
    status.style.cssText =
      "min-height:220px;display:grid;place-items:center;padding:32px;border-radius:8px;background:#0f2230;color:#f7f9fc;font:600 16px/1.5 system-ui,sans-serif;";

    if (isError) {
      status.style.background = "#2d1610";
      status.style.color = "#fff3ed";
    }

    target.appendChild(status);
  };

  const loadPage = async (target) => {
    const pageKey = target.dataset.mblPage || "home";
    const page = pages[pageKey];
    const siteBase = ensureSlashlessBase(target.dataset.mblSiteBase || DEFAULT_SITE_BASE);

    if (!page) {
      showStatus(target, `Page MBL inconnue : ${pageKey}`, true);
      return;
    }

    const sourceBase = page.sourceBase || HOME_SOURCE_BASE;
    const pageUrl = new URL(page.path, sourceBase).href;
    const stylesheet = new URL(page.stylesheet || `styles.css?v=${STYLE_VERSION}`, sourceBase).href;

    showStatus(target, "Chargement de la page MY BUSINESS LIFE...");

    try {
      const response = await fetch(pageUrl, { credentials: "omit" });
      if (!response.ok) throw new Error(`Réponse HTTP ${response.status}`);

      const html = await response.text();
      const doc = new DOMParser().parseFromString(html, "text/html");
      const fragment = document.createDocumentFragment();

      [...doc.body.children].forEach((child) => {
        if (child.tagName.toLowerCase() !== "script") {
          fragment.appendChild(child.cloneNode(true));
        }
      });

      rewriteAssets(fragment, pageUrl);
      rewriteLinks(fragment, pageUrl, siteBase);
      ensureStyles(stylesheet);

      target.innerHTML = "";
      target.appendChild(fragment);
      syncMeta(doc, page, siteBase);

      const scripts = page.scripts || [`script.js?v=${SCRIPT_VERSION}`];
      for (const scriptPath of scripts) {
        const scriptUrl = /^https?:\/\//i.test(scriptPath) ? scriptPath : new URL(scriptPath, sourceBase).href;
        await ensureScript(scriptUrl);
      }
    } catch (error) {
      showStatus(
        target,
        "La page MY BUSINESS LIFE n'a pas pu se charger. Vérifiez la connexion ou l'URL du loader.",
        true
      );
      console.error("[MBL loader]", error);
    }
  };

  document.querySelectorAll("[data-mbl-page]").forEach((target) => {
    loadPage(target);
  });
})();
