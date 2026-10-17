export function diagnoseSeller(input = {}) {
  const duration = input.sale_duration || "";
  const visits = input.visits_level || "";
  const offers = input.offers_status || "";
  const recent = ["Moins d'un mois", "1 à 3 mois"].includes(duration);
  let summary = "Les informations communiquées permettent de dégager plusieurs pistes, mais une analyse du bien, de l'annonce et des retours reste nécessaire avant de conclure.";
  let hypotheses = [];

  if (recent) {
    summary = "Ta commercialisation est encore récente. Le recul disponible reste limité : il est utile d'observer la qualité des premiers contacts, des visites et des retours avant de modifier la stratégie.";
    hypotheses = ["Mesurer la qualité des premiers contacts", "Recueillir des retours précis", "Vérifier la cohérence de la présentation"];
  } else if (visits === "Aucune") {
    summary = "Ton bien n'a pas encore généré de visite. Cela peut venir de la visibilité, de la présentation, du public ciblé ou d'un positionnement à vérifier. Ces hypothèses doivent être confrontées aux données de diffusion.";
    hypotheses = ["Visibilité auprès des bons acquéreurs", "Présentation de l'annonce", "Positionnement commercial à vérifier"];
  } else if (["Quelques visites", "Beaucoup de visites"].includes(visits) && offers === "Aucune") {
    summary = "Ton bien suscite un certain intérêt, mais aucune offre n'a encore concrétisé cet intérêt. Plusieurs explications sont possibles : décalage entre les attentes et la réalité, prix, objections lors des visites ou financement des acheteurs. Une analyse des retours de visites et du positionnement commercial pourrait aider à identifier les points à améliorer.";
    hypotheses = ["Analyser les objections de visite", "Comparer la promesse de l'annonce à la réalité", "Réexaminer le positionnement sans conclure automatiquement à une baisse"];
  } else if (offers === "Des offres trop basses") {
    summary = "Des acquéreurs se sont positionnés, mais leurs offres restent éloignées de tes attentes. Cet écart peut refléter la négociation, les travaux perçus, certaines caractéristiques du bien ou la lecture du marché. Il mérite une analyse factuelle.";
    hypotheses = ["Comprendre les arguments des offres", "Distinguer négociation et objections récurrentes", "Documenter les atouts et travaux éventuels"];
  } else if (offers === "Une offre qui n'a pas abouti") {
    summary = "Une offre a montré qu'un acquéreur pouvait se projeter, mais la vente n'a pas abouti. La prochaine étape consiste à examiner la raison réellement connue, les conditions de l'offre et le financement, sans en déduire une cause non confirmée.";
    hypotheses = ["Reconstituer les conditions de l'offre", "Identifier la raison confirmée de l'échec", "Sécuriser les prochaines étapes de négociation"];
  } else if (offers === "Une ou plusieurs offres sérieuses") {
    summary = "Ton bien a suscité une ou plusieurs offres sérieuses. Avant de modifier la stratégie, il faut comprendre leurs conditions, les éventuels écarts avec ton projet et les raisons pour lesquelles elles n'ont pas été retenues.";
    hypotheses = ["Comparer les conditions des offres", "Clarifier tes priorités de vente", "Préparer la prochaine négociation"];
  } else {
    hypotheses = ["Qualité et visibilité de l'annonce", "Retours obtenus pendant les visites", "Positionnement et calendrier du projet"];
  }

  const missing = [];
  if (!input.current_price_xpf) missing.push("Le prix actuellement affiché");
  if (!input.visits_count && visits !== "Aucune") missing.push("Le nombre approximatif de visites");
  if (!Array.isArray(input.feedback) || !input.feedback.length) missing.push("Les retours précis des visiteurs");
  if (offers === "Une offre qui n'a pas abouti" && !input.failed_offer_reason) missing.push("La raison connue de l'échec de l'offre");
  missing.push("L'annonce et ses supports", "Les caractéristiques et contraintes vérifiables du bien");

  return { summary, hypotheses: hypotheses.slice(0, 3), missing: [...new Set(missing)].slice(0, 5), disclaimer: "Ce diagnostic initial ne constitue ni une estimation immobilière définitive, ni une garantie de vente, de délai ou de prix." };
}

export function qualifySeller(input = {}, appointmentRequested = false) {
  const urgent = ["Vendre au plus vite", "Vendre dans les 3 mois"].includes(input.objective);
  const concrete = ["3 à 6 mois", "6 à 12 mois", "Plus de 12 mois"].includes(input.sale_duration);
  if (appointmentRequested || (urgent && concrete)) return "P1";
  if (urgent || concrete || input.objective === "Je réfléchis à changer de stratégie") return "P2";
  return "P3";
}
