(function () {
  "use strict";
  const $ = (selector) => document.querySelector(selector);
  const escapeHtml = (value) => String(value ?? "").replace(/[&<>\"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[character]);
  const formatDate = (value) => value
    ? new Intl.DateTimeFormat("fr-FR", { dateStyle: "medium", timeStyle: "short", timeZone: "Pacific/Tahiti" }).format(new Date(value))
    : "Jamais";

  async function load() {
    try {
      const [reportResponse, configResponse] = await Promise.all([
        fetch("/ai-reports/latest.json", { cache: "no-store" }),
        fetch("/config/ai-team.json", { cache: "no-store" })
      ]);
      if (!reportResponse.ok || !configResponse.ok) throw Error("Rapport indisponible");
      const report = await reportResponse.json();
      const config = await configResponse.json();
      const summary = report.summary || {};
      const agents = report.agents?.length ? report.agents : config.agents || [];
      const healthLabels = { healthy: "Sain", review: "À examiner", attention: "Attention", not_run: "Pas encore exécuté" };

      $("[data-health]").className = "ai-health " + escapeHtml(report.status);
      $("[data-health]").innerHTML = `<span>État du système</span><strong>${escapeHtml(healthLabels[report.status] || report.status)}</strong><small>Dernière analyse · ${escapeHtml(formatDate(report.finishedAt))}</small>`;
      const metrics = [
        [agents.filter((agent) => agent.enabled).length, "Agents configurés"],
        [summary.checks || 0, "Contrôles"],
        [summary.failures || 0, "Problèmes"],
        [summary.proposals || 0, "Propositions"],
        [Number(report.cost?.estimatedUsd || 0).toFixed(2) + " $", "Coût estimé"]
      ];
      $("[data-metrics]").innerHTML = metrics.map((metric) => `<article class="ai-metric"><strong>${escapeHtml(metric[0])}</strong><span>${escapeHtml(metric[1])}</span></article>`).join("");
      $("[data-agents]").innerHTML = agents.map((agent) => `<article class="ai-agent"><div><h3>${escapeHtml(agent.name)}</h3><p>${escapeHtml(agent.id)} · ${escapeHtml(agent.mode)}<br>Fréquence : ${escapeHtml((agent.cadences || []).join(", ") || "Aucune")}</p></div><span class="ai-status ${agent.enabled ? "on" : ""}">${agent.enabled ? "Actif" : "Désactivé"}</span></article>`).join("");
      $("[data-checks]").innerHTML = (report.checks || []).map((check) => `<tr><td><i class="ai-dot ${escapeHtml(check.status)}"></i></td><td>${escapeHtml(check.title)}</td><td>${escapeHtml(check.detail)}</td><td>${escapeHtml(check.agent)}</td></tr>`).join("") || '<tr><td colspan="4">Première analyse non encore exécutée.</td></tr>';
      $("[data-proposals]").innerHTML = (report.proposals || []).map((proposal) => `<article class="ai-proposal"><span>${escapeHtml(proposal.priority)} · ${escapeHtml(proposal.status)}</span><h3>${escapeHtml(proposal.title)}</h3><p>${escapeHtml(proposal.problem)}</p><p><b>Impact :</b> ${escapeHtml(proposal.expectedImpact)}</p></article>`).join("") || '<div class="ai-empty">Aucune proposition issue d’une exécution vérifiée pour le moment.</div>';
      $("[data-cost]").innerHTML = `<dl><dt>Appels aux modèles</dt><dd>${escapeHtml(report.cost?.modelCalls || 0)}</dd><dt>Coût de cette exécution</dt><dd>${escapeHtml(Number(report.cost?.estimatedUsd || 0).toFixed(2))} USD</dd><dt>Couche IA payante</dt><dd>${report.cost?.modelLayerEnabled ? "Activée" : "Désactivée"}</dd><dt>Fusion automatique</dt><dd>${config.autoMerge ? "Activée" : "Interdite"}</dd><dt>Déploiement automatique</dt><dd>${config.autoDeploy ? "Activé" : "Interdit"}</dd></dl>`;
      $("[data-notice]").textContent = report.source === "github-actions"
        ? "Résultats issus de GitHub Actions. Toute modification exige encore une revue et une fusion manuelle."
        : "Aucune exécution cloud approuvée n’a encore alimenté ce tableau. Les données affichées proviennent de la prévisualisation locale ou de l’état initial.";
    } catch (error) {
      $("[data-health]").innerHTML = `<span>État du système</span><strong>Indisponible</strong><small>${escapeHtml(error.message)}</small>`;
      $("[data-notice]").textContent = "Le dashboard ne simule aucun résultat : aucun rapport réel n’est disponible.";
    }
  }

  $("[data-refresh]").addEventListener("click", load);
  load();
})();
