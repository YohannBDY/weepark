/* ============================================================
   Vue Dashboard Gestionnaire — graphiques + KPIs + table zones
   ============================================================ */

window.WeePark = window.WeePark || {};

WeePark.Dashboard = (function () {
  let chartOcc  = null;
  let chartZone = null;

  /* ──── KPIs dynamiques ────────────────────────────────── */

  function updateKPIs() {
    const total   = WeePark.parkings.length;
    const occupee = WeePark.parkings.filter(p => p.statut === 'occupee' || p.statut === 'reservee').length;
    const libre   = total - occupee;
    const pct     = Math.round(occupee / total * 100);

    const valEl = document.getElementById('kpi-occ-value');
    const detEl = document.getElementById('kpi-occ-detail');
    if (valEl) valEl.textContent = pct + '%';
    if (detEl) detEl.textContent = `${occupee}/${total} places — ${libre} libres`;

    const revEl = document.getElementById('kpi-rev-value');
    if (revEl) {
      const revenu = WeePark.parkings
        .filter(p => p.statut !== 'libre')
        .reduce((sum, p) => sum + p.prix, 0);
      revEl.textContent = revenu + ' cr/h';
    }
  }

  /* ──── Table zones dynamique ──────────────────────────── */

  function buildZoneTable() {
    const zones = {};
    WeePark.parkings.forEach(p => {
      if (!zones[p.zone]) zones[p.zone] = { total: 0, libre: 0, occ: 0 };
      zones[p.zone].total++;
      if (p.statut === 'libre') zones[p.zone].libre++;
      else zones[p.zone].occ++;
    });

    const tbody = document.getElementById('dash-zone-tbody');
    if (!tbody) return;

    tbody.innerHTML = Object.entries(zones).map(([name, z]) => {
      const pct = Math.round(z.occ / z.total * 100);
      const cls = pct >= 80 ? 'red' : pct >= 50 ? 'orange' : 'green';
      return `<tr>
        <td>${name}</td>
        <td>${z.total}</td>
        <td><span class="badge badge-green">● ${z.libre}</span></td>
        <td><span class="badge badge-red">● ${z.occ}</span></td>
        <td><span class="taux-val taux-${cls}">${pct}%</span></td>
      </tr>`;
    }).join('');
  }

  /* ──── Graphiques ─────────────────────────────────────── */

  function buildOccupationChart() {
    const hours = [
      '06:00', '07:00', '08:00', '09:00', '10:00', '11:00',
      '12:00', '13:00', '14:00', '15:00', '16:00', '17:00',
      '18:00', '19:00', '20:00', '21:00',
    ];
    const data = [12, 20, 38, 62, 70, 72, 75, 70, 73, 78, 82, 88, 90, 72, 50, 28];

    const ctx = document.getElementById('chartOccupation').getContext('2d');
    chartOcc = new Chart(ctx, {
      type: 'line',
      data: {
        labels: hours,
        datasets: [{
          data,
          fill: true,
          borderColor: '#10b981',
          borderWidth: 2,
          backgroundColor: 'rgba(16,185,129,0.12)',
          tension: 0.4,
          pointRadius: 0,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: { legend: { display: false } },
        scales: {
          x: {
            ticks: { color: '#6b7280', font: { size: 10 }, maxTicksLimit: 6 },
            grid:  { color: 'rgba(0,0,0,0.06)' },
          },
          y: {
            min: 0, max: 100,
            ticks: { color: '#6b7280', font: { size: 10 }, callback: v => v + '%' },
            grid:  { color: 'rgba(0,0,0,0.06)' },
          },
        },
      },
    });
  }

  function buildZonesChart() {
    const zones    = ['Défense', 'Courbevoie', 'Puteaux', 'Neuilly'];
    const rotation = [7.8, 6.1, 5.5, 4.9];
    const tmr      = [3.2, 3.8, 4.2, 3.5];

    const ctx = document.getElementById('chartZones').getContext('2d');
    chartZone = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: zones,
        datasets: [
          { label: 'Rotation',   data: rotation, backgroundColor: '#10b981', borderRadius: 4 },
          { label: 'TMR (min)',  data: tmr,       backgroundColor: '#f59e0b', borderRadius: 4 },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: { legend: { labels: { color: '#6b7280', font: { size: 11 } } } },
        scales: {
          x: { ticks: { color: '#6b7280', font: { size: 10 } }, grid: { color: 'rgba(0,0,0,0.06)' } },
          y: { ticks: { color: '#6b7280', font: { size: 10 } }, grid: { color: 'rgba(0,0,0,0.06)' } },
        },
      },
    });
  }

  /* ──── Init ───────────────────────────────────────────── */

  function ensureInit() {
    if (chartOcc) {
      updateKPIs();
      buildZoneTable();
      return;
    }
    buildOccupationChart();
    buildZonesChart();
    updateKPIs();
    buildZoneTable();
  }

  function refresh() {
    if (!chartOcc) return;
    chartOcc.data.datasets[0].data = chartOcc.data.datasets[0].data.map(v =>
      Math.max(5, Math.min(100, v + (Math.random() - 0.5) * 15))
    );
    chartOcc.update();
    updateKPIs();
    buildZoneTable();
  }

  function bindEvents() {
    const btn = document.getElementById('refresh-dash-btn');
    if (btn) btn.addEventListener('click', refresh);
  }

  return { init: bindEvents, ensureInit, refresh };
})();
