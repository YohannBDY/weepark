/* ============================================================
   Vue Louer — annonces utilisateur (modal + liste + dates)
   ============================================================ */

window.WeePark = window.WeePark || {};

WeePark.Louer = (function () {
  const annonces = [];

  function openModal() {
    document.getElementById('modal-overlay').classList.remove('hidden');
  }

  function closeModal(e) {
    const overlay = document.getElementById('modal-overlay');
    if (!e || e.target === overlay) overlay.classList.add('hidden');
  }

  function publier() {
    const addr = document.getElementById('f-addr').value.trim();
    if (!addr) { alert('Veuillez entrer une adresse'); return; }

    const prix   = parseFloat(document.getElementById('f-prix').value) || 3;
    const taille = document.getElementById('f-taille').value;
    const desc   = document.getElementById('f-desc').value.trim();
    const from   = document.getElementById('f-from').value;
    const to     = document.getElementById('f-to').value;

    if (from && to && from > to) {
      alert('La date de fin doit être après la date de début.');
      return;
    }

    annonces.push({ addr, prix, taille, desc, from, to, id: Date.now() });
    render();
    closeModal();

    ['f-addr', 'f-desc', 'f-from', 'f-to'].forEach(id => {
      document.getElementById(id).value = '';
    });
  }

  function remove(id) {
    const i = annonces.findIndex(a => a.id === id);
    if (i !== -1) { annonces.splice(i, 1); render(); }
  }

  function fmtDate(d) {
    if (!d) return '';
    const [y, m, day] = d.split('-');
    return `${day}/${m}/${y}`;
  }

  function render() {
    const el = document.getElementById('louer-content');

    if (!annonces.length) {
      el.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon"><i data-lucide="car"></i></div>
          <div class="empty-title">Aucune annonce pour l'instant</div>
          <div class="empty-sub">Publiez votre première place de parking en location</div>
        </div>`;
    } else {
      el.innerHTML = `<div class="annonce-list">${annonces.map(a => {
        const dateStr = a.from && a.to
          ? `${fmtDate(a.from)} – ${fmtDate(a.to)}`
          : a.from ? `À partir du ${fmtDate(a.from)}` : '';
        const meta = [a.taille, dateStr, a.desc].filter(Boolean).join(' · ');
        return `
        <div class="annonce-card">
          <div>
            <div class="annonce-addr">${a.addr}</div>
            <div class="annonce-meta">${meta}</div>
          </div>
          <div style="display:flex;align-items:center;gap:12px">
            <div class="annonce-price">${a.prix.toFixed(2)}€<span>/h</span></div>
            <button class="delete-btn" onclick="WeePark.Louer.remove(${a.id})">Supprimer</button>
          </div>
        </div>`;
      }).join('')}</div>`;
    }

    lucide.createIcons();
  }

  function init() {
    document.getElementById('open-louer-modal').addEventListener('click', openModal);
    document.getElementById('close-louer-modal').addEventListener('click', () => closeModal());
    document.getElementById('modal-overlay').addEventListener('click', closeModal);
    document.getElementById('publier-btn').addEventListener('click', publier);
  }

  return { init, remove };
})();
