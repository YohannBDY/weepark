/* ============================================================
   Navigation entre les vues
   ============================================================ */

window.WeePark = window.WeePark || {};

WeePark.Navigation = (function () {
  function show(view) {
    document.querySelectorAll('.view').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(el => el.classList.remove('active'));

    document.getElementById('view-' + view).classList.add('active');
    document.getElementById('nav-' + view).classList.add('active');

    if (view === 'carte')       WeePark.Map.ensureInit();
    if (view === 'dashboard')   WeePark.Dashboard.ensureInit();
    if (view === 'stats')       WeePark.Stats.ensureInit();
  }

  function init() {
    document.querySelectorAll('.nav-btn[data-view]').forEach(btn => {
      btn.addEventListener('click', () => show(btn.dataset.view));
    });
  }

  return { init, show };
})();
