window.MathildeClientSpaces = window.MathildeClientSpaces || {};

window.MathildeClientSpaces.config = {
  appsScriptUrl: "https://script.google.com/macros/s/AKfycbz4enH0HwIrDP05pEtfjF2MO10oXFPPdfHeb4l5FwQvrpaH8rwi00-pwdm6IG2zM6Sc0A/exec",
  defaultDemoMandatId: "MANDAT_DEMO_FICTIF",
  ownerLoginPage: "/suivi-vendeur.html",
  ownerDashboardPage: "/espace-vendeur.html",
  tokenMode: "private-token"
};

window.MathildeClientSpaces.sellerProperties = {
  "maison-papeete-demo": {
    slug: "maison-papeete-demo",
    accessToken: "demo-vendeur",
    isDemo: true,
    title: "Maison familiale fictive — Papeete",
    status: "Commercialisation active",
    price: "76 500 000 XPF",
    location: "Papeete",
    launchDate: "15 mai 2026",
    welcomeMessage: "Ia ora na, bienvenue dans ton espace vendeur. Tu peux suivre ici les visites prévues, les retours des visites réalisées et les prochaines informations utiles pour avancer clairement.",
    stats: {
      pageViews: 428,
      whatsappClicks: 37,
      phoneClicks: 9,
      infoRequests: 12,
      visitRequests: 5,
      qualifiedProspects: 6,
      completedVisits: 4
    },
    marketingActions: [
      { label: "Annonce publiée sur mathildekw.com", status: "termine", date: "15 mai 2026", comment: "Page dédiée avec photos, informations clés et CTA WhatsApp." },
      { label: "Diffusion au Market Center Keller Williams Polynésie", status: "termine", date: "16 mai 2026", comment: "Bien partagé aux agents KW pour relais interne." },
      { label: "Partage auprès du réseau d’agents", status: "en-cours", date: "Depuis le 16 mai 2026", comment: "Suivi des retours et profils intéressés." },
      { label: "Publication Facebook", status: "termine", date: "16 mai 2026", comment: "Publication orientée maison familiale, secteur pratique et potentiel extérieur." },
      { label: "Publication Marketplace", status: "prevu", date: "18 mai 2026", comment: "Préparation d’un descriptif court et qualifiant." },
      { label: "Relance acquéreurs qualifiés", status: "en-cours", date: "Cette semaine", comment: "Relance des profils actifs sur Papeete, Pirae et Arue." },
      { label: "Campagne sponsorisée en cours", status: "en-cours", date: "Depuis le 17 mai 2026", comment: "Suivi des clics et demandes WhatsApp." },
      { label: "Suivi des demandes entrantes", status: "en-cours", date: "Quotidien", comment: "Qualification des projets avant visite physique." },
      { label: "Mise à jour des supports de vente", status: "prevu", date: "Fin de semaine", comment: "Ajustement selon les retours des acheteurs." }
    ],
    marketFeedback: [
      { date: "16 mai 2026", buyerProfile: "Famille en résidence principale", interest: "chaud", summary: "A aimé la localisation et le potentiel extérieur, souhaite confirmer sa capacité d’emprunt.", objection: "Financement à valider", nextAction: "Appel de suivi et envoi des informations complémentaires." },
      { date: "16 mai 2026", buyerProfile: "Profil investisseur patrimonial", interest: "tiede", summary: "Intéressé par le secteur, attend une première lecture des travaux possibles.", objection: "Budget travaux à préciser", nextAction: "Préparer une synthèse des points à vérifier." },
      { date: "17 mai 2026", buyerProfile: "Acheteur déjà préqualifié", interest: "chaud", summary: "Acheteur sérieux, souhaite organiser une deuxième visite avec sa famille.", objection: "Disponibilité de visite", nextAction: "Proposer deux créneaux et préparer les documents utiles." },
      { date: "17 mai 2026", buyerProfile: "Acheteur curieux", interest: "froid", summary: "A demandé la visite virtuelle mais le budget ne correspond pas encore.", objection: "Budget inférieur au prix affiché", nextAction: "Garder le contact pour un autre bien plus adapté." }
    ],
    documents: [
      { label: "Estimation", status: "Exemple fictif", url: "#" },
      { label: "Mandat", status: "Exemple fictif", url: "#" },
      { label: "Diagnostics", status: "À brancher", url: "#" },
      { label: "Plans", status: "À brancher", url: "#" },
      { label: "Photos", status: "Dossier Google Drive possible", url: "#" },
      { label: "Offres reçues", status: "Aucune offre fictive affichée", url: "#" },
      { label: "Documents notaire", status: "Accès privé à prévoir", url: "#" }
    ],
    nextSteps: [
      { action: "Relancer les prospects ayant demandé la fiche complète.", targetDate: "18 mai 2026", owner: "Mathilde KW", comment: "Priorité aux profils financés et disponibles rapidement." },
      { action: "Faire un point prix après 15 jours de diffusion.", targetDate: "30 mai 2026", owner: "Mathilde KW + vendeur", comment: "Analyser demandes, objections, visites et qualité des prospects." },
      { action: "Préparer le bilan mensuel vendeur.", targetDate: "Début juin 2026", owner: "Mathilde KW", comment: "Synthèse des actions, chiffres clés et recommandations." },
      { action: "Organiser une nouvelle campagne de diffusion si besoin.", targetDate: "Selon retours marché", owner: "Mathilde KW", comment: "Ajuster l’angle selon les profils les plus réactifs." }
    ]
  },
  "jambolana-pk11": {
    slug: "jambolana-pk11",
    accessToken: "changer-ce-token",
    isDemo: false,
    title: "Bien vendeur privé — exemple à personnaliser",
    status: "Préparation de commercialisation",
    price: "Prix à confirmer",
    location: "Commune à compléter",
    launchDate: "À définir",
    welcomeMessage: "Ia ora na, bienvenue dans ton espace vendeur. Cette V1 se concentre sur les visites prévues et les retours terrain utiles pour suivre la vente simplement.",
    stats: {
      pageViews: 0,
      whatsappClicks: 0,
      phoneClicks: 0,
      infoRequests: 0,
      visitRequests: 0,
      qualifiedProspects: 0,
      completedVisits: 0
    },
    marketingActions: [],
    marketFeedback: [],
    documents: [],
    nextSteps: []
  }
};
