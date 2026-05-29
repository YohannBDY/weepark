/* ============================================================
   Vue Stats — disponibilité en temps réel pour l'utilisateur
   ============================================================ */

window.WeePark = window.WeePark || {};

WeePark.Stats = (function () {

  let refreshTimer = null;
  let ready        = false;

  const TAILLE_LABELS = {
    petite:  'Petite',
    moyenne: 'Moyenne',
    grande:  'Grande',
    suv:     'SUV / Van',
  };

  /* ──── Calculs ────────────────────────────────────────── */

  function zoneStats() {
    const zones = {};
    WeePark.parkings.forEach(p => {
      if (!zones[p.zone]) zones[p.zone] = { total: 0, libre: 0, prixMin: 99 };
      zones[p.zone].total++;
      if (p.statut === 'libre') {
        zones[p.zone].libre++;
        if (p.prix < zones[p.zone].prixMin) zones[p.zone].prixMin = p.prix;
      }
    });
    return zones;
  }

  function cheapestFree() {
    return [...WeePark.parkings]
      .filter(p => p.statut === 'libre')
      .sort((a, b) => a.prix - b.prix)
      .slice(0, 3);
  }

  /* ──── Rendu ──────────────────────────────────────────── */

  function render() {
    const total = WeePark.parkings.length;
    const libre = WeePark.parkings.filter(p => p.statut === 'libre').length;
    const pct   = Math.round(libre / total * 100);

    document.getElementById('stats-libre-count').textContent = libre;
    document.getElementById('stats-libre-sub').textContent   =
      `${pct}% disponibles — sur ${total} places au total`;

    const zones   = zoneStats();
    const zonesEl = document.getElementById('stats-zones');
    zonesEl.innerHTML = Object.entries(zones).map(([name, z]) => {
      const p      = z.total > 0 ? Math.round(z.libre / z.total * 100) : 0;
      const color  = p > 50 ? '#10b981' : p > 20 ? '#f59e0b' : '#ef4444';
      const label  = z.libre === 0 ? 'Complet' : `${z.libre} libre${z.libre > 1 ? 's' : ''}`;
      const dispo  = z.libre > 0 ? `Dès ${z.prixMin} cr/h` : 'Aucune dispo';
      return `
        <div class="stats-zone-card">
          <div class="stats-zone-header">
            <span class="stats-zone-name">${name}</span>
            <span class="stats-zone-badge" style="color:${color}">${label}</span>
          </div>
          <div class="stats-zone-bar-bg">
            <div class="stats-zone-bar-fill" style="width:${p}%;background:${color}"></div>
          </div>
          <div class="stats-zone-footer">
            <span>${z.total} places</span>
            <span>${dispo}</span>
          </div>
        </div>`;
    }).join('');

    const spots   = cheapestFree();
    const cheapEl = document.getElementById('stats-cheap');
    if (!spots.length) {
      cheapEl.innerHTML = '<div class="stats-empty">Aucune place libre actuellement.</div>';
    } else {
      cheapEl.innerHTML = spots.map(p => `
        <div class="stats-spot-row">
          <div class="stats-spot-info">
            <span class="stats-spot-rue">${p.rue}</span>
            <span class="stats-spot-zone">${p.zone} · ${TAILLE_LABELS[p.taille] || p.taille}</span>
          </div>
          <span class="stats-spot-prix">${p.prix} cr/h</span>
        </div>`).join('');
    }
  }

  /* ──── Init ───────────────────────────────────────────── */

  function ensureInit() {
    if (!ready) {
      ready = true;
      refreshTimer = setInterval(render, 5000);
    }
    render();
  }

  return { init: () => {}, ensureInit };
})();
