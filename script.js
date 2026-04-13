const PRODUCTION_DOMAIN = "https://mybusinesslife.fr";
const SOURCE_ROUTE_MAP = Object.freeze({
  "/home/": "/",
  "/home/index.html": "/",
  "/home/contact.html": "/contact",
  "/home/diagnostic.html": "/diagnostic",
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
    window.location.replace(`${PRODUCTION_DOMAIN}${productionPath}${window.location.search}${window.location.hash}`);
  }
}

const legacyDiagnosticType = new URLSearchParams(window.location.search).get("diagnostic");
if (legacyDiagnosticType && !window.location.pathname.includes("diagnostic")) {
  const stagingPrefix = window.location.pathname.startsWith("/test/") ? "/test/" : "";
  window.location.replace(`${stagingPrefix || "/"}diagnostic.html?type=${encodeURIComponent(legacyDiagnosticType)}`);
}

document.documentElement.classList.add("js-enabled");

const menuToggle = document.querySelector(".menu-toggle");
const siteNav = document.querySelector(".site-nav");
const navGroups = document.querySelectorAll(".nav-group");
const animatedItems = document.querySelectorAll("[data-animate]");
const tiltCards = document.querySelectorAll(".tilt-card");
const contactForm = document.querySelector("[data-contact-form]");
const diagnosticApp = document.querySelector("[data-diagnostic-app]");
const quoteApp = document.querySelector("[data-quote-app]");

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

const getDiagnosticEndpoint = () => {
  if (window.location.pathname.startsWith("/test/")) return "/test/api/diagnostic";
  return "/api/diagnostic";
};

const postLead = async (type, payload) => {
  const response = await fetch(getDiagnosticEndpoint(), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      type,
      source: window.location.href,
      payload,
    }),
  });

  if (!response.ok) {
    throw new Error(`Réponse serveur ${response.status}`);
  }

  return response.json();
};

const escapeHtml = (value) =>
  String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

const openPreparedEmail = (data) => {
  const name = data.get("name") || "";
  const email = data.get("email") || "";
  const profile = data.get("profile") || "";
  const topic = data.get("topic") || "";
  const message = data.get("message") || "";
  const subject = encodeURIComponent(`Demande MBL - ${topic}`);
  const body = encodeURIComponent(
    `Nom : ${name}\nEmail : ${email}\nProfil : ${profile}\nSujet : ${topic}\n\nMessage :\n${message}`
  );

  window.location.href = `mailto:contact@mybusinesslife.fr?subject=${subject}&body=${body}`;
};

if (contactForm) {
  contactForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const data = new FormData(contactForm);
    const status = contactForm.querySelector("[data-form-status]");
    const payload = Object.fromEntries(data.entries());

    if (status) status.textContent = "Envoi de votre demande...";

    try {
      const result = await postLead("contact", payload);
      if (status) {
        status.textContent = `Demande envoyée. Référence : ${result.id}.`;
      }
      contactForm.reset();
    } catch (_error) {
      openPreparedEmail(data);
      if (status) {
        status.textContent = "Envoi serveur indisponible. Votre application email va s’ouvrir avec le message préparé.";
      }
    }
  });
}

const diagnosticTracks = {
  repair: {
    label: "Réparation ordinateur",
    summary: "Diagnostic matériel ou logiciel, urgence, symptômes et données à protéger.",
    questions: [
      {
        id: "issue",
        title: "Quel est le problème principal ?",
        text: "Choisissez ce qui ressemble le plus à votre situation actuelle.",
        type: "single",
        options: [
          ["pc_lent", "Ordinateur très lent", "Démarrage, navigation ou logiciels qui ralentissent."],
          ["ne_demarre_pas", "Ne démarre plus", "Écran noir, boucle, batterie ou problème système."],
          ["virus", "Virus ou sécurité", "Pop-ups, doute sur un piratage ou comportement étrange."],
          ["donnees", "Données à récupérer", "Fichiers importants, sauvegarde ou disque à vérifier."],
        ],
      },
      {
        id: "urgency",
        title: "À quel point est-ce urgent ?",
        text: "Cela nous aide à prioriser la réponse.",
        type: "single",
        options: [
          ["bloquant", "Bloquant aujourd’hui", "Vous ne pouvez plus travailler ou utiliser le PC."],
          ["rapide", "À traiter rapidement", "Le problème ralentit fortement votre quotidien."],
          ["confort", "Amélioration confort", "Vous voulez nettoyer, optimiser ou sécuriser."],
          ["prevention", "Prévention", "Vous voulez éviter une panne ou protéger vos données."],
        ],
      },
      {
        id: "details",
        title: "Décrivez les symptômes visibles.",
        text: "Ajoutez le modèle si vous le connaissez, les messages d’erreur et ce qui a changé récemment.",
        type: "textarea",
        placeholder: "Exemple : PC portable HP, très lent depuis une mise à jour, ventilateur bruyant...",
      },
    ],
  },
  web: {
    label: "Création de site internet",
    summary: "Objectif commercial, cible, pages clés, image de marque et parcours de conversion.",
    questions: [
      {
        id: "website_goal",
        title: "Quel rôle doit jouer le site ?",
        text: "Un bon site commence par une mission claire.",
        type: "single",
        options: [
          ["vitrine", "Présenter votre activité", "Un site premium pour inspirer confiance."],
          ["conversion", "Générer des demandes", "Landing page, tunnel, publicité ou acquisition."],
          ["refonte", "Refondre l’existant", "Moderniser, clarifier et améliorer la conversion."],
          ["vente", "Vendre ou réserver", "Paiement, réservation, catalogue ou prise de rendez-vous."],
        ],
      },
      {
        id: "website_assets",
        title: "De quoi disposez-vous déjà ?",
        text: "Cochez les éléments existants pour cadrer le niveau de production.",
        type: "multi",
        options: [
          ["logo", "Logo et identité visuelle"],
          ["textes", "Textes ou offre déjà claire"],
          ["photos", "Photos ou visuels"],
          ["domaine", "Nom de domaine / hébergement"],
          ["analytics", "Statistiques ou trafic existant"],
        ],
      },
      {
        id: "website_context",
        title: "Qui doit être convaincu par le site ?",
        text: "Décrivez votre cible, votre offre principale et l’action souhaitée.",
        type: "textarea",
        placeholder: "Exemple : dirigeants de TPE, demande de contact, prise de rendez-vous, image haut de gamme...",
      },
    ],
  },
  software: {
    label: "Logiciel sur mesure",
    summary: "Process métier, utilisateurs, données, automatisations et visibilité à construire.",
    questions: [
      {
        id: "software_process",
        title: "Quel process voulez-vous mieux piloter ?",
        text: "Choisissez le noyau métier à transformer en outil.",
        type: "multi",
        options: [
          ["crm", "CRM et suivi client"],
          ["planning", "Planning, interventions ou tournées"],
          ["facturation", "Facturation ou paiements"],
          ["stock", "Stock, produits ou achats"],
          ["dashboard", "Tableaux de bord et reporting"],
          ["portail", "Portail client ou espace équipe"],
        ],
      },
      {
        id: "software_pain",
        title: "Qu’est-ce qui vous fait perdre le plus de temps ?",
        text: "Le sur-mesure devient utile quand une friction coûte cher chaque semaine.",
        type: "single",
        options: [
          ["double_saisie", "Doubles saisies", "Les mêmes données circulent partout."],
          ["suivi_flou", "Suivi flou", "Vous manquez de visibilité sur l’activité."],
          ["erreurs", "Erreurs fréquentes", "Factures, oublis, relances ou données incorrectes."],
          ["outils_trop_nombreux", "Trop d’outils", "Abonnements cumulés et informations dispersées."],
        ],
      },
      {
        id: "software_tools",
        title: "Quels outils utilisez-vous aujourd’hui ?",
        text: "Listez vos logiciels actuels, fichiers Excel, outils SaaS et irritants principaux.",
        type: "textarea",
        placeholder: "Exemple : Excel, Google Agenda, Notion, facturation séparée, WhatsApp pour les équipes...",
      },
    ],
  },
  automation: {
    label: "Automatisation",
    summary: "Tâches répétitives, outils connectés, relances et flux de données.",
    questions: [
      {
        id: "automation_tasks",
        title: "Quelles tâches voulez-vous automatiser ?",
        text: "Cochez tout ce qui revient trop souvent.",
        type: "multi",
        options: [
          ["relances", "Relances clients ou prospects"],
          ["documents", "Documents et factures"],
          ["emails", "Emails et notifications"],
          ["data", "Synchronisation de données"],
          ["planning", "Planning ou affectation"],
          ["reporting", "Reporting automatique"],
        ],
      },
      {
        id: "automation_trigger",
        title: "À quel moment l’automatisation doit-elle se déclencher ?",
        text: "Cela permet d’identifier les connexions nécessaires.",
        type: "single",
        options: [
          ["nouveau_contact", "Nouveau contact"],
          ["commande", "Commande ou paiement"],
          ["date", "Date, échéance ou retard"],
          ["statut", "Changement de statut"],
        ],
      },
      {
        id: "automation_stack",
        title: "Quels outils doivent communiquer ensemble ?",
        text: "Indiquez vos outils actuels : email, CRM, tableur, agenda, facturation, boutique, etc.",
        type: "textarea",
        placeholder: "Exemple : Gmail, Google Sheets, Calendly, Stripe, Notion, logiciel de facturation...",
      },
    ],
  },
  strategy: {
    label: "Stratégie digitale",
    summary: "Priorités, offre, acquisition, organisation et plan d’action.",
    questions: [
      {
        id: "strategy_priority",
        title: "Quelle priorité voulez-vous clarifier ?",
        text: "Le diagnostic doit identifier le meilleur prochain mouvement.",
        type: "single",
        options: [
          ["visibilite", "Gagner en visibilité"],
          ["conversion", "Transformer plus de visiteurs en contacts"],
          ["organisation", "Structurer vos outils et process"],
          ["lancement", "Lancer une nouvelle offre ou activité"],
        ],
      },
      {
        id: "strategy_stage",
        title: "Où en êtes-vous aujourd’hui ?",
        text: "Votre niveau de maturité change complètement la recommandation.",
        type: "single",
        options: [
          ["idee", "Idée ou projet en cadrage"],
          ["actif", "Activité déjà lancée"],
          ["croissance", "Croissance avec besoin de structure"],
          ["refonte", "Besoin de reprendre les bases"],
        ],
      },
      {
        id: "strategy_context",
        title: "Quel serait le résultat idéal dans 90 jours ?",
        text: "Donnez une vision concrète : plus de clients, moins de temps perdu, meilleure image, process clair.",
        type: "textarea",
        placeholder: "Exemple : un site clair, une offre mieux présentée, un plan d’action et des outils cohérents...",
      },
    ],
  },
  unsure: {
    label: "Je ne sais pas encore",
    summary: "Diagnostic ouvert pour comprendre votre situation avant de choisir le bon service.",
    questions: [
      {
        id: "main_blocker",
        title: "Qu’est-ce qui vous bloque le plus aujourd’hui ?",
        text: "On part du problème, pas d’une solution vendue trop vite.",
        type: "single",
        options: [
          ["technique", "Un problème technique"],
          ["visibilite", "Manque de visibilité"],
          ["temps", "Trop de temps perdu"],
          ["idee", "Une idée à concrétiser"],
        ],
      },
      {
        id: "desired_help",
        title: "Quel type d’aide serait le plus utile ?",
        text: "Même si ce n’est pas encore précis, choisissez l’intention la plus proche.",
        type: "single",
        options: [
          ["conseil", "Être conseillé"],
          ["creation", "Faire créer quelque chose"],
          ["reparation", "Réparer ou débloquer"],
          ["organisation", "Organiser et automatiser"],
        ],
      },
      {
        id: "open_context",
        title: "Racontez la situation avec vos mots.",
        text: "Quelques phrases suffisent pour préparer une première lecture claire.",
        type: "textarea",
        placeholder: "Exemple : je ne sais pas s’il me faut un site, un outil ou simplement une meilleure organisation...",
      },
    ],
  },
};

const diagnosticBaseQuestions = [
  {
    id: "need",
    title: "Quelle situation voulez-vous diagnostiquer ?",
    text: "Le parcours va changer automatiquement selon votre choix.",
    type: "single",
    options: [
      ["web", "Créer ou améliorer un site internet", "Image premium, SEO, conversion, tunnel d’acquisition."],
      ["software", "Créer un logiciel ou outil métier", "CRM, portail, dashboard, planning, application interne."],
      ["repair", "Réparer ou optimiser un ordinateur", "Panne, lenteur, virus, sauvegarde ou configuration."],
      ["automation", "Automatiser des tâches répétitives", "Relances, documents, données, reporting, notifications."],
      ["strategy", "Clarifier une stratégie digitale", "Priorités, plan d’action, offre, visibilité, organisation."],
      ["unsure", "Je ne sais pas encore", "On part de votre blocage pour trouver la bonne direction."],
    ],
  },
  {
    id: "profile",
    title: "Vous venez avec quel profil ?",
    text: "Cela adapte le vocabulaire, les priorités et le niveau d’accompagnement.",
    type: "single",
    options: [
      ["particulier", "Particulier", "Besoin personnel, ordinateur, projet ou aide digitale."],
      ["independant", "Indépendant", "Offre, visibilité, organisation ou outils simples."],
      ["entreprise", "Entreprise", "Équipe, process, croissance, productivité et pilotage."],
      ["association", "Association ou autre structure", "Besoin opérationnel, communication ou organisation."],
    ],
  },
];

const diagnosticClosingQuestions = [
  {
    id: "timeline",
    title: "Quel timing avez-vous en tête ?",
    text: "Cela permet de distinguer l’urgence, le cadrage et le projet structurant.",
    type: "single",
    options: [
      ["urgent", "Cette semaine"],
      ["court", "Dans le mois"],
      ["trimestre", "Dans les 3 mois"],
      ["exploration", "Je compare les options"],
    ],
  },
  {
    id: "contact",
    title: "Où peut-on vous envoyer le retour de diagnostic ?",
    text: "Ajoutez vos coordonnées et une précision utile. Vous recevrez une réponse plus qualifiée qu’un simple formulaire.",
    type: "contact",
  },
];

const createDiagnosticQuestionList = (answers) => {
  const selectedNeed = answers.need || "unsure";
  const track = diagnosticTracks[selectedNeed] || diagnosticTracks.unsure;
  return [...diagnosticBaseQuestions, ...track.questions, ...diagnosticClosingQuestions];
};

const getSelectedTrack = (answers) => diagnosticTracks[answers.need] || diagnosticTracks.unsure;

if (diagnosticApp) {
  const stepContainer = diagnosticApp.querySelector("[data-diagnostic-step]");
  const progressBar = diagnosticApp.querySelector("[data-diagnostic-progress]");
  const kicker = diagnosticApp.querySelector("[data-diagnostic-kicker]");
  const focus = diagnosticApp.querySelector("[data-diagnostic-focus]");
  const summary = diagnosticApp.querySelector("[data-diagnostic-summary]");
  const prevButton = diagnosticApp.querySelector("[data-diagnostic-prev]");
  const nextButton = diagnosticApp.querySelector("[data-diagnostic-next]");
  const status = diagnosticApp.querySelector("[data-diagnostic-status]");
  let diagnosticIndex = 0;
  const answers = {};

  const setStatus = (message, isError = false) => {
    if (!status) return;
    status.textContent = message || "";
    status.style.color = isError ? "#8f2f0e" : "#0b5d6c";
  };

  const currentQuestions = () => createDiagnosticQuestionList(answers);

  const updateDiagnosticRail = () => {
    const track = getSelectedTrack(answers);
    focus.textContent = track.label;
    summary.textContent = track.summary;
  };

  const getAnswer = (question) => answers[question.id];

  const setAnswer = (question, value) => {
    answers[question.id] = value;
    updateDiagnosticRail();
    renderDiagnostic();
  };

  const renderOptions = (question) => {
    const selected = getAnswer(question);
    const isMulti = question.type === "multi";
    const values = Array.isArray(selected) ? selected : [];

    return `<div class="diagnostic-options">
      ${question.options
        .map(([value, label, helper = ""]) => {
          const isSelected = isMulti ? values.includes(value) : selected === value;
          return `<button class="diagnostic-option ${isSelected ? "is-selected" : ""}" type="button" data-diagnostic-value="${value}">
              <strong>${escapeHtml(label)}</strong>
              ${helper ? `<span>${escapeHtml(helper)}</span>` : ""}
            </button>`;
        })
        .join("")}
    </div>`;
  };

  const renderTextArea = (question) => {
    const value = getAnswer(question) || "";
    return `<div class="diagnostic-fields">
      <label class="diagnostic-field full">
        Votre réponse
        <textarea data-diagnostic-input="${escapeHtml(question.id)}" placeholder="${escapeHtml(question.placeholder || "")}">${escapeHtml(value)}</textarea>
      </label>
    </div>`;
  };

  const renderContact = () => {
    const contact = answers.contact || {};
    return `<div class="diagnostic-fields">
      <label class="diagnostic-field">
        Nom
        <input data-diagnostic-contact="name" type="text" autocomplete="name" value="${escapeHtml(contact.name)}" />
      </label>
      <label class="diagnostic-field">
        Email
        <input data-diagnostic-contact="email" type="email" autocomplete="email" value="${escapeHtml(contact.email)}" />
      </label>
      <label class="diagnostic-field">
        Téléphone
        <input data-diagnostic-contact="phone" type="tel" autocomplete="tel" value="${escapeHtml(contact.phone)}" />
      </label>
      <label class="diagnostic-field">
        Niveau de projet
        <select data-diagnostic-contact="level">
          ${["À définir", "Simple", "Intermédiaire", "Premium", "Évolutif"]
            .map((value) => `<option ${contact.level === value ? "selected" : ""}>${escapeHtml(value)}</option>`)
            .join("")}
        </select>
      </label>
      <label class="diagnostic-field full">
        Précision importante
        <textarea data-diagnostic-contact="message" placeholder="Ajoutez ce qui doit absolument être compris avant de vous répondre.">${escapeHtml(contact.message)}</textarea>
      </label>
    </div>`;
  };

  const renderDiagnostic = () => {
    const questions = currentQuestions();
    const question = questions[Math.min(diagnosticIndex, questions.length - 1)];
    const progress = ((diagnosticIndex + 1) / questions.length) * 100;

    if (progressBar) progressBar.style.setProperty("--diagnostic-progress", `${progress}%`);
    if (kicker) kicker.textContent = `Étape ${diagnosticIndex + 1} sur ${questions.length}`;
    if (prevButton) prevButton.disabled = diagnosticIndex === 0;
    if (nextButton) nextButton.textContent = diagnosticIndex === questions.length - 1 ? "Envoyer le diagnostic" : "Continuer";
    updateDiagnosticRail();
    setStatus("");

    const body =
      question.type === "single" || question.type === "multi"
        ? renderOptions(question)
        : question.type === "contact"
          ? renderContact()
          : renderTextArea(question);

    stepContainer.innerHTML = `
      <p class="eyebrow dark">${escapeHtml(getSelectedTrack(answers).label)}</p>
      <h3>${escapeHtml(question.title)}</h3>
      <p>${escapeHtml(question.text)}</p>
      ${body}
    `;
  };

  const syncInputs = () => {
    stepContainer.querySelectorAll("[data-diagnostic-input]").forEach((input) => {
      answers[input.dataset.diagnosticInput] = input.value.trim();
    });

    const contact = { ...(answers.contact || {}) };
    stepContainer.querySelectorAll("[data-diagnostic-contact]").forEach((input) => {
      contact[input.dataset.diagnosticContact] = input.value.trim();
    });
    if (Object.keys(contact).length) answers.contact = contact;
  };

  const isCurrentValid = () => {
    syncInputs();
    const question = currentQuestions()[diagnosticIndex];
    const value = answers[question.id];

    if (question.type === "multi") return Array.isArray(value) && value.length > 0;
    if (question.type === "contact") {
      const contact = answers.contact || {};
      return Boolean(contact.name && contact.email && contact.email.includes("@"));
    }
    return Boolean(value);
  };

  const submitDiagnostic = async () => {
    if (!isCurrentValid()) {
      setStatus("Complétez cette étape pour recevoir un diagnostic exploitable.", true);
      return;
    }

    const track = getSelectedTrack(answers);
    setStatus("Transmission du diagnostic en cours...");
    nextButton.disabled = true;

    try {
      const result = await postLead("diagnostic", {
        track: track.label,
        answers,
      });
      setStatus(`Diagnostic envoyé. Référence : ${result.id}. MY BUSINESS LIFE peut vous répondre avec un contexte clair.`);
      nextButton.textContent = "Diagnostic envoyé";
    } catch (_error) {
      setStatus("Impossible d’envoyer pour le moment. Vos réponses restent affichées, vous pouvez réessayer.", true);
      nextButton.disabled = false;
    }
  };

  stepContainer.addEventListener("click", (event) => {
    const option = event.target.closest("[data-diagnostic-value]");
    if (!option) return;

    const question = currentQuestions()[diagnosticIndex];
    const value = option.dataset.diagnosticValue;

    if (question.type === "multi") {
      const values = new Set(Array.isArray(answers[question.id]) ? answers[question.id] : []);
      if (values.has(value)) values.delete(value);
      else values.add(value);
      setAnswer(question, [...values]);
      return;
    }

    setAnswer(question, value);
  });

  stepContainer.addEventListener("input", () => {
    syncInputs();
  });

  prevButton.addEventListener("click", () => {
    syncInputs();
    diagnosticIndex = Math.max(0, diagnosticIndex - 1);
    renderDiagnostic();
  });

  nextButton.addEventListener("click", () => {
    const questions = currentQuestions();
    if (diagnosticIndex === questions.length - 1) {
      submitDiagnostic();
      return;
    }

    if (!isCurrentValid()) {
      setStatus("Sélectionnez ou renseignez une réponse pour continuer.", true);
      return;
    }

    diagnosticIndex += 1;
    renderDiagnostic();
  });

  const requestedDiagnostic = new URLSearchParams(window.location.search).get("diagnostic");
  if (requestedDiagnostic && diagnosticTracks[requestedDiagnostic]) {
    answers.need = requestedDiagnostic;
    diagnosticIndex = 1;
  }

  renderDiagnostic();
}

const quoteServices = {
  web: {
    label: "Site web",
    icon: "WEB",
    insight: "Un projet web dépend surtout de l’objectif, du nombre de pages, des contenus et du niveau de conversion attendu.",
    baseMin: 900,
    baseMax: 2200,
    timeMin: 2,
    timeMax: 5,
    unit: "semaines",
    recommendations: ["Arborescence claire", "Design responsive", "SEO technique", "Parcours de conversion"],
    questions: [
      {
        id: "web_goal",
        short: "Objectif",
        title: "Quel résultat le site doit-il produire ?",
        text: "Choisissez l’objectif prioritaire. C’est lui qui donne le niveau d’exigence du projet.",
        type: "single",
        options: [
          { value: "vitrine", icon: "VIS", label: "Présenter une activité", helper: "Un site crédible, clair et rassurant.", costMin: 0, costMax: 250, timeMin: 0, timeMax: 1, tags: ["image", "clarté"] },
          { value: "leads", icon: "CTA", label: "Générer des demandes", helper: "Pages pensées pour convertir les visiteurs.", costMin: 450, costMax: 1200, timeMin: 1, timeMax: 2, tags: ["conversion", "formulaires"] },
          { value: "refonte", icon: "NEW", label: "Refondre l’existant", helper: "Reprendre l’image, la structure et la performance.", costMin: 650, costMax: 1600, timeMin: 1, timeMax: 3, tags: ["audit", "migration"] },
          { value: "vente", icon: "PAY", label: "Vendre ou réserver", helper: "Catalogue, réservation, paiement ou tunnel.", costMin: 1200, costMax: 3200, timeMin: 2, timeMax: 5, tags: ["paiement", "tunnel"] },
        ],
      },
      {
        id: "web_scope",
        short: "Pages",
        title: "Quelles briques faut-il prévoir ?",
        text: "Cochez tout ce qui doit entrer dans le périmètre de départ.",
        type: "multi",
        options: [
          { value: "copy", icon: "TXT", label: "Textes et structure d’offre", costMin: 250, costMax: 900, timeMin: 0, timeMax: 1, tags: ["copywriting"] },
          { value: "seo", icon: "SEO", label: "SEO local ou national", costMin: 350, costMax: 1100, timeMin: 1, timeMax: 2, tags: ["SEO"] },
          { value: "blog", icon: "LOG", label: "Blog ou ressources", costMin: 250, costMax: 850, timeMin: 0, timeMax: 1, tags: ["contenu"] },
          { value: "booking", icon: "CAL", label: "Prise de rendez-vous", costMin: 180, costMax: 650, timeMin: 0, timeMax: 1, tags: ["Calendly"] },
          { value: "analytics", icon: "KPI", label: "Suivi des conversions", costMin: 180, costMax: 550, timeMin: 0, timeMax: 1, tags: ["tracking"] },
          { value: "multilingual", icon: "FR+", label: "Version multilingue", costMin: 450, costMax: 1600, timeMin: 1, timeMax: 3, tags: ["langues"] },
        ],
      },
      {
        id: "web_assets",
        short: "Contenus",
        title: "Où en sont les contenus et l’identité visuelle ?",
        text: "Plus les éléments sont prêts, plus l’effort peut se concentrer sur la qualité de production.",
        type: "single",
        options: [
          { value: "ready", icon: "OK", label: "Logo, textes et images prêts", helper: "Le projet peut avancer vite.", costMin: 0, costMax: 0, timeMin: 0, timeMax: 0 },
          { value: "partial", icon: "MID", label: "Une partie seulement", helper: "Il faudra clarifier et compléter.", costMin: 250, costMax: 900, timeMin: 1, timeMax: 2, tags: ["cadrage"] },
          { value: "none", icon: "NEW", label: "Tout est à créer", helper: "Identité, textes, images ou direction éditoriale.", costMin: 750, costMax: 2500, timeMin: 2, timeMax: 4, tags: ["identité", "contenu"] },
        ],
      },
    ],
  },
  software: {
    label: "Logiciel métier",
    icon: "APP",
    insight: "Un logiciel métier dépend du périmètre, des utilisateurs, des données, des intégrations et du niveau de sécurité.",
    baseMin: 3000,
    baseMax: 8500,
    timeMin: 4,
    timeMax: 10,
    unit: "semaines",
    recommendations: ["Cadrage fonctionnel", "Prototype", "Base de données", "Tableaux de bord"],
    questions: [
      {
        id: "software_scope",
        short: "Modules",
        title: "Quels modules doivent exister au départ ?",
        text: "La recommandation se construit autour des fonctions vraiment nécessaires au lancement.",
        type: "multi",
        options: [
          { value: "crm", icon: "CRM", label: "CRM et suivi client", costMin: 700, costMax: 2200, timeMin: 1, timeMax: 3, tags: ["CRM"] },
          { value: "planning", icon: "CAL", label: "Planning, interventions ou tournées", costMin: 950, costMax: 3200, timeMin: 2, timeMax: 4, tags: ["planning"] },
          { value: "billing", icon: "FAC", label: "Facture ou paiement", costMin: 900, costMax: 3600, timeMin: 2, timeMax: 5, tags: ["facturation"] },
          { value: "portal", icon: "USR", label: "Espace client ou équipe", costMin: 1100, costMax: 4200, timeMin: 2, timeMax: 5, tags: ["portail"] },
          { value: "stock", icon: "STK", label: "Stock, achats ou produits", costMin: 950, costMax: 3400, timeMin: 2, timeMax: 4, tags: ["stock"] },
          { value: "dashboard", icon: "KPI", label: "Reporting et tableaux de bord", costMin: 650, costMax: 2600, timeMin: 1, timeMax: 3, tags: ["reporting"] },
        ],
      },
      {
        id: "software_users",
        short: "Utilisateurs",
        title: "Combien de personnes utiliseront l’outil ?",
        text: "Le nombre d’utilisateurs influence les droits, les écrans, la formation et la sécurité.",
        type: "single",
        options: [
          { value: "solo", icon: "1", label: "1 à 3 personnes", helper: "Petit périmètre, décision rapide.", costMin: 0, costMax: 500, timeMin: 0, timeMax: 1 },
          { value: "team", icon: "10", label: "4 à 10 personnes", helper: "Rôles simples et process partagés.", costMin: 500, costMax: 1800, timeMin: 1, timeMax: 2, tags: ["rôles"] },
          { value: "scale", icon: "30", label: "11 à 30 personnes", helper: "Droits, supervision et fiabilité plus importants.", costMin: 1300, costMax: 4200, timeMin: 2, timeMax: 4, tags: ["permissions"] },
          { value: "org", icon: "50+", label: "Plus de 30 personnes", helper: "Approche plus structurée et évolutive.", costMin: 2600, costMax: 8200, timeMin: 4, timeMax: 8, tags: ["architecture"] },
        ],
      },
      {
        id: "software_integrations",
        short: "Connexions",
        title: "L’outil doit-il communiquer avec d’autres systèmes ?",
        text: "Les intégrations changent fortement la complexité technique.",
        type: "multi",
        options: [
          { value: "email", icon: "MAIL", label: "Emails et notifications", costMin: 250, costMax: 900, timeMin: 0, timeMax: 1, tags: ["notifications"] },
          { value: "calendar", icon: "CAL", label: "Agenda ou planning externe", costMin: 450, costMax: 1600, timeMin: 1, timeMax: 2, tags: ["agenda"] },
          { value: "payment", icon: "PAY", label: "Paiement ou facturation", costMin: 850, costMax: 3600, timeMin: 2, timeMax: 5, tags: ["paiement"] },
          { value: "api", icon: "API", label: "API métier ou logiciel existant", costMin: 900, costMax: 5200, timeMin: 2, timeMax: 6, tags: ["API"] },
          { value: "import", icon: "CSV", label: "Import Excel ou migration de données", costMin: 350, costMax: 1800, timeMin: 1, timeMax: 3, tags: ["migration"] },
        ],
      },
    ],
  },
  repair: {
    label: "Réparation PC",
    icon: "PC",
    insight: "Une intervention dépend du symptôme, de l’urgence, du nombre d’appareils et de l’importance des données à protéger.",
    baseMin: 60,
    baseMax: 140,
    timeMin: 1,
    timeMax: 3,
    unit: "jours",
    recommendations: ["Diagnostic matériel", "Sécurité", "Sauvegarde", "Plan de remise en état"],
    questions: [
      {
        id: "repair_issue",
        short: "Panne",
        title: "Quel problème faut-il traiter ?",
        text: "Choisissez le symptôme principal.",
        type: "single",
        options: [
          { value: "slow", icon: "SLOW", label: "Ordinateur lent", helper: "Démarrage, logiciels ou navigation très lents.", costMin: 30, costMax: 160, timeMin: 0, timeMax: 1, tags: ["optimisation"] },
          { value: "boot", icon: "BOOT", label: "Ne démarre plus", helper: "Écran noir, boucle, batterie ou système bloqué.", costMin: 60, costMax: 280, timeMin: 1, timeMax: 3, tags: ["panne"] },
          { value: "virus", icon: "SEC", label: "Virus ou sécurité", helper: "Pop-ups, comportement étrange, doute sur un piratage.", costMin: 50, costMax: 240, timeMin: 1, timeMax: 2, tags: ["sécurité"] },
          { value: "data", icon: "DATA", label: "Données à récupérer", helper: "Fichiers importants, sauvegarde ou disque à vérifier.", costMin: 80, costMax: 420, timeMin: 1, timeMax: 5, tags: ["données"] },
        ],
      },
      {
        id: "repair_device",
        short: "Matériel",
        title: "Combien d’appareils sont concernés ?",
        text: "Cela permet d’estimer le temps d’intervention.",
        type: "single",
        options: [
          { value: "one", icon: "1", label: "Un ordinateur", helper: "Diagnostic simple.", costMin: 0, costMax: 0, timeMin: 0, timeMax: 0 },
          { value: "two_three", icon: "2-3", label: "Deux à trois appareils", helper: "Contrôles et recommandations groupés.", costMin: 60, costMax: 260, timeMin: 1, timeMax: 2, tags: ["multi-postes"] },
          { value: "many", icon: "4+", label: "Quatre appareils ou plus", helper: "Approche parc informatique.", costMin: 180, costMax: 700, timeMin: 2, timeMax: 5, tags: ["parc"] },
        ],
      },
      {
        id: "repair_context",
        short: "Symptômes",
        title: "Décrivez les symptômes et les données importantes.",
        text: "Ajoutez le modèle, les messages visibles, les logiciels concernés et ce qui ne doit pas être perdu.",
        type: "textarea",
        placeholder: "Exemple : PC portable Lenovo, écran noir depuis hier, fichiers professionnels à récupérer...",
      },
    ],
  },
  automation: {
    label: "Automatisation",
    icon: "AUTO",
    insight: "Une automatisation dépend du nombre de tâches, des outils à connecter et du niveau de fiabilité attendu.",
    baseMin: 450,
    baseMax: 1600,
    timeMin: 1,
    timeMax: 4,
    unit: "semaines",
    recommendations: ["Cartographie du flux", "Scénarios", "Tests", "Documentation simple"],
    questions: [
      {
        id: "automation_tasks",
        short: "Tâches",
        title: "Quelles tâches voulez-vous automatiser ?",
        text: "Cochez les tâches qui reviennent trop souvent.",
        type: "multi",
        options: [
          { value: "followup", icon: "REL", label: "Relances clients ou prospects", costMin: 180, costMax: 700, timeMin: 0, timeMax: 1, tags: ["relances"] },
          { value: "documents", icon: "DOC", label: "Documents et factures", costMin: 350, costMax: 1400, timeMin: 1, timeMax: 2, tags: ["documents"] },
          { value: "data", icon: "SYNC", label: "Synchronisation de données", costMin: 450, costMax: 2200, timeMin: 1, timeMax: 3, tags: ["synchronisation"] },
          { value: "alerts", icon: "NOT", label: "Notifications et alertes", costMin: 180, costMax: 800, timeMin: 0, timeMax: 1, tags: ["alertes"] },
          { value: "reporting", icon: "KPI", label: "Reporting automatique", costMin: 350, costMax: 1600, timeMin: 1, timeMax: 2, tags: ["reporting"] },
        ],
      },
      {
        id: "automation_stack",
        short: "Outils",
        title: "Quels outils doivent communiquer ensemble ?",
        text: "Plus les outils sont nombreux ou fermés, plus il faut prévoir de cadrage et de tests.",
        type: "single",
        options: [
          { value: "two", icon: "2", label: "Deux outils simples", helper: "Email, formulaire, tableur ou agenda.", costMin: 0, costMax: 400, timeMin: 0, timeMax: 1 },
          { value: "many", icon: "3+", label: "Plusieurs outils", helper: "CRM, facturation, planning, stockage, boutique.", costMin: 450, costMax: 1900, timeMin: 1, timeMax: 3, tags: ["multi-outils"] },
          { value: "custom", icon: "API", label: "Logiciel métier ou API", helper: "Connexion plus technique ou documentation à analyser.", costMin: 900, costMax: 3600, timeMin: 2, timeMax: 5, tags: ["API"] },
        ],
      },
      {
        id: "automation_context",
        short: "Flux",
        title: "Décrivez le flux idéal.",
        text: "Expliquez ce qui doit déclencher l’automatisation et ce qui doit se passer ensuite.",
        type: "textarea",
        placeholder: "Exemple : quand un formulaire est rempli, créer un client, envoyer un email et ajouter une ligne de suivi...",
      },
    ],
  },
  strategy: {
    label: "Stratégie digitale",
    icon: "PLAN",
    insight: "Un diagnostic stratégique sert à décider quoi faire, dans quel ordre, avec quels moyens et quel objectif de croissance.",
    baseMin: 350,
    baseMax: 1200,
    timeMin: 1,
    timeMax: 3,
    unit: "semaines",
    recommendations: ["Audit", "Priorités", "Plan d’action", "Feuille de route"],
    questions: [
      {
        id: "strategy_need",
        short: "Priorité",
        title: "Quelle priorité voulez-vous clarifier ?",
        text: "Choisissez la zone où une meilleure décision aurait le plus d’impact.",
        type: "single",
        options: [
          { value: "visibility", icon: "SEO", label: "Gagner en visibilité", helper: "SEO, présence locale, contenus, image.", costMin: 150, costMax: 650, timeMin: 0, timeMax: 1, tags: ["visibilité"] },
          { value: "conversion", icon: "CTA", label: "Convertir plus de prospects", helper: "Offre, pages, tunnel, message.", costMin: 250, costMax: 950, timeMin: 1, timeMax: 2, tags: ["conversion"] },
          { value: "tools", icon: "SYS", label: "Structurer les outils", helper: "Process, logiciels, automatisations, pilotage.", costMin: 300, costMax: 1300, timeMin: 1, timeMax: 2, tags: ["organisation"] },
          { value: "launch", icon: "GO", label: "Lancer une offre", helper: "Positionnement, parcours, premiers supports.", costMin: 400, costMax: 1700, timeMin: 1, timeMax: 3, tags: ["lancement"] },
        ],
      },
      {
        id: "strategy_stage",
        short: "Maturité",
        title: "Où en êtes-vous aujourd’hui ?",
        text: "La réponse change le type de mission recommandé.",
        type: "single",
        options: [
          { value: "idea", icon: "ID", label: "Idée ou projet naissant", helper: "Il faut poser les bases.", costMin: 0, costMax: 400, timeMin: 0, timeMax: 1 },
          { value: "active", icon: "ON", label: "Activité déjà lancée", helper: "Il faut améliorer ce qui existe.", costMin: 200, costMax: 750, timeMin: 0, timeMax: 1 },
          { value: "growth", icon: "UP", label: "Croissance à structurer", helper: "Il faut prioriser et industrialiser.", costMin: 450, costMax: 1600, timeMin: 1, timeMax: 3, tags: ["croissance"] },
          { value: "restart", icon: "FIX", label: "Besoin de repartir proprement", helper: "Audit et nouvelle direction.", costMin: 350, costMax: 1400, timeMin: 1, timeMax: 2, tags: ["audit"] },
        ],
      },
      {
        id: "strategy_context",
        short: "Vision",
        title: "Quel résultat serait vraiment utile dans 90 jours ?",
        text: "Décrivez le résultat attendu avec vos mots.",
        type: "textarea",
        placeholder: "Exemple : clarifier mon offre, obtenir plus de demandes, choisir les bons outils, arrêter de m’éparpiller...",
      },
    ],
  },
  unsure: {
    label: "À clarifier",
    icon: "MBL",
    insight: "Quand le besoin est flou, la bonne réponse commence par une première qualification large.",
    baseMin: 250,
    baseMax: 1200,
    timeMin: 1,
    timeMax: 3,
    unit: "semaines",
    recommendations: ["Diagnostic global", "Priorisation", "Scénarios", "Prochaine action"],
    questions: [
      {
        id: "unsure_blocker",
        short: "Blocage",
        title: "Qu’est-ce qui vous bloque le plus aujourd’hui ?",
        text: "Partez du problème, même si la solution n’est pas encore claire.",
        type: "single",
        options: [
          { value: "technical", icon: "TECH", label: "Problème technique", helper: "Panne, outil, site ou système bloquant.", costMin: 80, costMax: 450, timeMin: 0, timeMax: 1, tags: ["technique"] },
          { value: "visibility", icon: "VIS", label: "Manque de visibilité", helper: "On ne vous trouve pas assez ou le message manque de force.", costMin: 250, costMax: 950, timeMin: 1, timeMax: 2, tags: ["visibilité"] },
          { value: "time", icon: "TIME", label: "Trop de temps perdu", helper: "Process, tâches répétitives, outils dispersés.", costMin: 450, costMax: 1800, timeMin: 1, timeMax: 3, tags: ["productivité"] },
          { value: "idea", icon: "ID", label: "Idée à concrétiser", helper: "Site, outil, offre ou projet à cadrer.", costMin: 350, costMax: 1600, timeMin: 1, timeMax: 3, tags: ["cadrage"] },
        ],
      },
      {
        id: "unsure_context",
        short: "Situation",
        title: "Racontez la situation simplement.",
        text: "Quelques phrases suffisent pour préparer une première orientation.",
        type: "textarea",
        placeholder: "Exemple : je ne sais pas s’il me faut un site, une automatisation, un outil ou juste une stratégie plus claire...",
      },
    ],
  },
};

const quoteCommonSteps = [
  {
    id: "profile",
    short: "Profil",
    title: "Vous venez avec quel profil ?",
    text: "Le niveau d’accompagnement dépend de votre contexte.",
    type: "single",
    options: [
      { value: "particulier", icon: "PERS", label: "Particulier", helper: "Besoin personnel, aide digitale ou ordinateur.", costMin: 0, costMax: 0 },
      { value: "independant", icon: "SOLO", label: "Indépendant", helper: "Visibilité, offre, outils simples et efficacité.", costMin: 0, costMax: 250 },
      { value: "entreprise", icon: "PRO", label: "Entreprise", helper: "Équipe, process, croissance et pilotage.", costMin: 250, costMax: 900, timeMin: 0, timeMax: 1 },
      { value: "association", icon: "ORG", label: "Association ou structure", helper: "Organisation, communication, besoins opérationnels.", costMin: 0, costMax: 350 },
    ],
  },
  {
    id: "quality_level",
    short: "Niveau",
    title: "Quel niveau de finition attendez-vous ?",
    text: "Cela évite de comparer un minimum viable avec une solution premium.",
    type: "single",
    options: [
      { value: "essential", icon: "MIN", label: "Simple et efficace", helper: "Priorité au besoin principal.", costMin: 0, costMax: 0, factor: 0.92, tags: ["essentiel"] },
      { value: "premium", icon: "PRO", label: "Premium et très soigné", helper: "Image, expérience et détails importants.", costMin: 350, costMax: 1800, factor: 1.12, tags: ["premium"] },
      { value: "scalable", icon: "SCL", label: "Robuste et évolutif", helper: "Prévoir la suite dès le départ.", costMin: 650, costMax: 3200, factor: 1.18, tags: ["évolutif"] },
      { value: "unknown", icon: "?", label: "À définir ensemble", helper: "Le diagnostic sert justement à trancher.", costMin: 0, costMax: 450, tags: ["cadrage"] },
    ],
  },
  {
    id: "deadline",
    short: "Timing",
    title: "Quel timing avez-vous en tête ?",
    text: "L’urgence peut changer l’organisation du projet.",
    type: "single",
    options: [
      { value: "urgent", icon: "NOW", label: "Très urgent", helper: "Besoin bloquant ou opportunité immédiate.", costMin: 120, costMax: 1100, factor: 1.16, timeMin: -1, timeMax: -1, tags: ["priorité haute"] },
      { value: "month", icon: "30J", label: "Dans le mois", helper: "Objectif court terme.", costMin: 0, costMax: 350, timeMin: 0, timeMax: 0 },
      { value: "quarter", icon: "90J", label: "Dans les 3 mois", helper: "Projet à cadrer proprement.", costMin: 0, costMax: 0, timeMin: 0, timeMax: 1 },
      { value: "explore", icon: "CAL", label: "Je compare les options", helper: "Besoin de comprendre avant de décider.", costMin: 0, costMax: 0, factor: 0.96, timeMin: 1, timeMax: 2 },
    ],
  },
  {
    id: "contact",
    short: "Contact",
    title: "Où peut-on vous envoyer le retour qualifié ?",
    text: "Ajoutez vos coordonnées et une précision importante pour recevoir une réponse utile.",
    type: "contact",
  },
];

const quoteStartStep = {
  id: "type",
  short: "Besoin",
  title: "Quel est votre besoin ?",
  text: "Choisissez une entrée. Les questions suivantes s’adaptent automatiquement.",
  type: "single",
  options: Object.entries(quoteServices).map(([value, service]) => ({
    value,
    icon: service.icon,
    label: service.label,
    helper: service.insight,
  })),
};

const getQuoteTypeFromUrl = () => {
  const params = new URLSearchParams(window.location.search);
  return params.get("type") || params.get("diagnostic") || "";
};

const getQuoteSteps = (answers) => {
  const service = quoteServices[answers.type] || quoteServices.unsure;
  return [quoteStartStep, quoteCommonSteps[0], ...service.questions, quoteCommonSteps[1], quoteCommonSteps[2], quoteCommonSteps[3]];
};

const getOptionByValue = (question, value) => question.options?.find((option) => option.value === value);

const formatQuoteTimeline = (min, max, unit) => {
  const safeMin = Math.max(1, Math.round(min));
  const safeMax = Math.max(safeMin, Math.round(max));
  return safeMin === safeMax ? `${safeMin} ${unit}` : `${safeMin} à ${safeMax} ${unit}`;
};

const getComplexityLabel = (score) => {
  if (score <= 3) return "Simple";
  if (score <= 7) return "Intermédiaire";
  if (score <= 12) return "Structurant";
  return "Avancé";
};

const getNextStepLabel = (answers) => {
  if (!answers.type) return "Choisir un besoin";
  if (!answers.profile) return "Préciser le contexte";
  if (!answers.quality_level) return "Définir le niveau attendu";
  if (!answers.deadline) return "Fixer le timing";
  return "Brief prêt à transmettre";
};

const computeQuoteEstimate = (answers) => {
  const type = answers.type || "unsure";
  const service = quoteServices[type] || quoteServices.unsure;
  const steps = getQuoteSteps(answers);
  let timeMin = service.timeMin;
  let timeMax = service.timeMax;
  let complexityScore = answers.type ? 1 : 0;
  const tags = new Set(service.recommendations);

  steps.forEach((question) => {
    const answer = answers[question.id];
    if (!answer || !question.options) return;
    const values = Array.isArray(answer) ? answer : [answer];
    values.forEach((value) => {
      const option = getOptionByValue(question, value);
      if (!option) return;
      timeMin += option.timeMin || 0;
      timeMax += option.timeMax || 0;
      complexityScore += Math.max(1, Math.ceil(((option.timeMin || 0) + (option.timeMax || 0)) / 2));
      if (option.factor && option.factor > 1) complexityScore += 1;
      (option.tags || []).forEach((tag) => tags.add(tag));
    });
  });

  return {
    type,
    label: service.label,
    icon: service.icon,
    complexity: answers.type ? getComplexityLabel(complexityScore) : "À préciser",
    nextStep: getNextStepLabel(answers),
    timeline: formatQuoteTimeline(timeMin, timeMax, service.unit),
    recommendations: [...tags].slice(0, 6),
  };
};

if (quoteApp) {
  const quoteStepContainer = quoteApp.querySelector("[data-quote-step]");
  const quoteStepList = quoteApp.querySelector("[data-quote-step-list]");
  const quoteProgress = quoteApp.querySelector("[data-quote-progress]");
  const quoteKicker = quoteApp.querySelector("[data-quote-kicker]");
  const quoteRailTitle = quoteApp.querySelector("[data-quote-rail-title]");
  const quoteInsight = quoteApp.querySelector("[data-quote-insight]");
  const quoteIcon = quoteApp.querySelector("[data-quote-icon]");
  const quoteFocus = quoteApp.querySelector("[data-quote-focus]");
  const quoteTimeline = quoteApp.querySelector("[data-quote-timeline]");
  const quoteSummary = quoteApp.querySelector("[data-quote-summary]");
  const quotePrev = quoteApp.querySelector("[data-quote-prev]");
  const quoteNext = quoteApp.querySelector("[data-quote-next]");
  const quoteStatus = quoteApp.querySelector("[data-quote-status]");
  const quoteAnswers = {};
  let quoteIndex = 0;

  const requestedType = getQuoteTypeFromUrl();
  if (quoteServices[requestedType]) {
    quoteAnswers.type = requestedType;
    quoteIndex = 1;
  }

  const setQuoteStatus = (message, isError = false) => {
    if (!quoteStatus) return;
    quoteStatus.textContent = message || "";
    quoteStatus.style.color = isError ? "#8f2f0e" : "#0b5d6c";
  };

  const syncQuoteInputs = () => {
    quoteStepContainer.querySelectorAll("[data-quote-textarea]").forEach((input) => {
      quoteAnswers[input.dataset.quoteTextarea] = input.value.trim();
    });

    const contact = { ...(quoteAnswers.contact || {}) };
    quoteStepContainer.querySelectorAll("[data-quote-contact]").forEach((input) => {
      contact[input.dataset.quoteContact] = input.value.trim();
    });
    if (Object.keys(contact).length) quoteAnswers.contact = contact;
  };

  const setQuoteAnswer = (question, value) => {
    quoteAnswers[question.id] = value;
    if (question.id === "type") {
      Object.keys(quoteAnswers).forEach((key) => {
        if (!["type", "profile", "quality_level", "deadline", "contact"].includes(key)) delete quoteAnswers[key];
      });
    }
    renderQuote();
  };

  const renderQuoteOptions = (question) => {
    const selected = quoteAnswers[question.id];
    const selectedValues = Array.isArray(selected) ? selected : [];
    const isMulti = question.type === "multi";

    return `<div class="quote-options ${isMulti ? "is-multi" : ""}">
      ${question.options
        .map((option) => {
          const isSelected = isMulti ? selectedValues.includes(option.value) : selected === option.value;
          return `<button class="quote-option ${isSelected ? "is-selected" : ""}" type="button" data-quote-value="${escapeHtml(option.value)}">
            <span aria-hidden="true">${escapeHtml(option.icon || "MBL")}</span>
            <strong>${escapeHtml(option.label)}</strong>
            ${option.helper ? `<small>${escapeHtml(option.helper)}</small>` : ""}
          </button>`;
        })
        .join("")}
    </div>`;
  };

  const renderQuoteTextarea = (question) => {
    const value = quoteAnswers[question.id] || "";
    return `<label class="quote-textarea-label">
      Votre contexte
      <textarea data-quote-textarea="${escapeHtml(question.id)}" placeholder="${escapeHtml(question.placeholder || "")}">${escapeHtml(value)}</textarea>
    </label>`;
  };

  const renderQuoteContact = () => {
    const contact = quoteAnswers.contact || {};
    return `<div class="quote-contact-grid">
      <label>Nom<input data-quote-contact="name" type="text" autocomplete="name" value="${escapeHtml(contact.name)}" /></label>
      <label>Email<input data-quote-contact="email" type="email" autocomplete="email" value="${escapeHtml(contact.email)}" /></label>
      <label>Téléphone<input data-quote-contact="phone" type="tel" autocomplete="tel" value="${escapeHtml(contact.phone)}" /></label>
      <label>Société ou projet<input data-quote-contact="company" type="text" autocomplete="organization" value="${escapeHtml(contact.company)}" /></label>
      <label class="full">Précision finale<textarea data-quote-contact="message" placeholder="Ajoutez une contrainte, un lien, une urgence ou un détail à ne pas manquer.">${escapeHtml(contact.message)}</textarea></label>
    </div>`;
  };

  const isQuoteStepValid = () => {
    syncQuoteInputs();
    const question = getQuoteSteps(quoteAnswers)[quoteIndex];
    const value = quoteAnswers[question.id];
    if (question.type === "multi") return Array.isArray(value) && value.length > 0;
    if (question.type === "contact") {
      const contact = quoteAnswers.contact || {};
      return Boolean(contact.name && contact.email && contact.email.includes("@"));
    }
    return Boolean(value);
  };

  const renderQuoteSummary = () => {
    const estimate = computeQuoteEstimate(quoteAnswers);
    const service = quoteServices[estimate.type] || quoteServices.unsure;
    quoteRailTitle.textContent = estimate.label;
    quoteInsight.textContent = service.insight;
    quoteIcon.textContent = estimate.icon;
    quoteFocus.textContent = quoteAnswers.type ? estimate.complexity : "À préciser";
    quoteTimeline.textContent = quoteAnswers.type ? `Délai à cadrer : ${estimate.timeline}` : "Vos réponses préparent la recommandation.";
    quoteSummary.innerHTML = `
      <div><span>Besoin</span><strong>${escapeHtml(estimate.label)}</strong></div>
      <div><span>Profil</span><strong>${escapeHtml(quoteAnswers.profile || "À préciser")}</strong></div>
      <div><span>Complexité</span><strong>${escapeHtml(estimate.complexity)}</strong></div>
      <div><span>Prochaine étape</span><strong>${escapeHtml(estimate.nextStep)}</strong></div>
      <div><span>À prévoir</span><strong>${estimate.recommendations.map(escapeHtml).join(", ")}</strong></div>
    `;
  };

  const renderQuoteStepList = (steps) => {
    quoteStepList.innerHTML = steps
      .map(
        (step, index) => `<li class="${index === quoteIndex ? "is-active" : ""} ${index < quoteIndex ? "is-done" : ""}">
          <span>${String(index + 1).padStart(2, "0")}</span>
          <b>${escapeHtml(step.short)}</b>
        </li>`
      )
      .join("");
  };

  function renderQuote() {
    const steps = getQuoteSteps(quoteAnswers);
    quoteIndex = Math.min(quoteIndex, steps.length - 1);
    const question = steps[quoteIndex];
    const progress = ((quoteIndex + 1) / steps.length) * 100;
    const body =
      question.type === "single" || question.type === "multi"
        ? renderQuoteOptions(question)
        : question.type === "contact"
          ? renderQuoteContact()
          : renderQuoteTextarea(question);

    quoteProgress.style.setProperty("--quote-progress", `${progress}%`);
    quoteKicker.textContent = `Étape ${quoteIndex + 1} sur ${steps.length}`;
    quotePrev.disabled = quoteIndex === 0;
    quoteNext.disabled = false;
    quoteNext.textContent = quoteIndex === steps.length - 1 ? "Envoyer la demande" : "Continuer";
    setQuoteStatus("");
    renderQuoteStepList(steps);
    renderQuoteSummary();

    quoteStepContainer.innerHTML = `
      <p class="eyebrow dark">${escapeHtml((quoteServices[quoteAnswers.type] || quoteServices.unsure).label)}</p>
      <h2>${escapeHtml(question.title)}</h2>
      <p>${escapeHtml(question.text)}</p>
      ${body}
    `;
  }

  const submitQuote = async () => {
    if (!isQuoteStepValid()) {
      setQuoteStatus("Complétez vos coordonnées pour recevoir une réponse exploitable.", true);
      return;
    }

    const estimate = computeQuoteEstimate(quoteAnswers);
    quoteNext.disabled = true;
    setQuoteStatus("Transmission du diagnostic...");

    try {
      const result = await postLead("quote", {
        track: estimate.label,
        estimate,
        answers: quoteAnswers,
      });
      setQuoteStatus(`Demande envoyée. Référence : ${result.id}. Votre brief est prêt pour une réponse personnalisée.`);
      quoteNext.textContent = "Demande envoyée";
    } catch (_error) {
      quoteNext.disabled = false;
      setQuoteStatus("L’envoi serveur n’a pas répondu. Vos réponses restent visibles pour réessayer.", true);
    }
  };

  quoteStepContainer.addEventListener("click", (event) => {
    const option = event.target.closest("[data-quote-value]");
    if (!option) return;
    const question = getQuoteSteps(quoteAnswers)[quoteIndex];
    const value = option.dataset.quoteValue;

    if (question.type === "multi") {
      const values = new Set(Array.isArray(quoteAnswers[question.id]) ? quoteAnswers[question.id] : []);
      if (values.has(value)) values.delete(value);
      else values.add(value);
      setQuoteAnswer(question, [...values]);
      return;
    }

    setQuoteAnswer(question, value);
  });

  quoteStepContainer.addEventListener("input", syncQuoteInputs);

  quotePrev.addEventListener("click", () => {
    syncQuoteInputs();
    quoteIndex = Math.max(0, quoteIndex - 1);
    renderQuote();
  });

  quoteNext.addEventListener("click", () => {
    const steps = getQuoteSteps(quoteAnswers);
    if (quoteIndex === steps.length - 1) {
      submitQuote();
      return;
    }

    if (!isQuoteStepValid()) {
      setQuoteStatus("Sélectionnez ou renseignez une réponse pour continuer.", true);
      return;
    }

    quoteIndex += 1;
    renderQuote();
  });

  renderQuote();
}
