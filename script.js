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
    window.location.replace(`${PRODUCTION_DOMAIN}${productionPath}${window.location.search}${window.location.hash}`);
  }
}

document.documentElement.classList.add("js-enabled");

const menuToggle = document.querySelector(".menu-toggle");
const siteNav = document.querySelector(".site-nav");
const navGroups = document.querySelectorAll(".nav-group");
const animatedItems = document.querySelectorAll("[data-animate]");
const tiltCards = document.querySelectorAll(".tilt-card");
const contactForm = document.querySelector("[data-contact-form]");
const diagnosticApp = document.querySelector("[data-diagnostic-app]");

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
        placeholder: "Exemple : dirigeants de TPE, demande de devis, prise de rendez-vous, image haut de gamme...",
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
          ["facturation", "Devis, facturation ou paiements"],
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
          ["documents", "Documents, devis ou factures"],
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
        Budget ou enveloppe
        <select data-diagnostic-contact="budget">
          ${["À définir", "Moins de 500€", "500€ à 1 500€", "1 500€ à 5 000€", "5 000€+"]
            .map((value) => `<option ${contact.budget === value ? "selected" : ""}>${escapeHtml(value)}</option>`)
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
