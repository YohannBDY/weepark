/* ============================================================
   Vue Carte — Leaflet, marqueurs, filtres, guidage vocal,
   réservation payante, géolocalisation, intégration GPS
   ============================================================ */

window.WeePark = window.WeePark || {};

WeePark.Map = (function () {

  const STATUT_COLORS = {
    libre:    '#10b981',
    occupee:  '#ef4444',
    reservee: '#f59e0b',
  };

  const STATUT_LABELS = {
    libre:    'Libre',
    occupee:  'Occupée',
    reservee: 'Réservée',
  };

  const TAILLE_LABELS = {
    petite:  'Petite',
    moyenne: 'Moyenne',
    grande:  'Grande',
    suv:     'SUV / Van',
  };

  const RESERVE_COST    = 5;
  const RESERVE_SECONDS = 180;
  const PROXIMITY_M     = 200;

  let map          = null;
  let markers      = {};
  let toastTimer   = null;
  let reservedId   = null;
  let userMarker   = null;
  let userLatLng   = null;
  let guidanceOn   = false;
  let filters      = { statut: 'all', taille: 'all' };
  let currentPopup = null;

  const geoCache   = {};

  /* ──── Initialisation ─────────────────────────────────── */

  function init() {
    if (map) return;

    map = L.map('map', { zoomControl: false }).setView([48.8924, 2.2384], 15);

    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      attribution: '© OpenStreetMap © CARTO',
      maxZoom: 19,
    }).addTo(map);

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    WeePark.parkings.forEach(addMarker);
    updateCounts();

    setInterval(simulateChanges, 5000);

    document.querySelector('.locate-btn').addEventListener('click', locateUser);
    document.getElementById('guidance-btn').addEventListener('click', toggleGuidance);
    document.getElementById('filter-bar').addEventListener('click', toggleFilterPanel);

    document.querySelectorAll('.filter-chip').forEach(chip => {
      chip.addEventListener('click', e => {
        e.stopPropagation();
        const group = chip.dataset.filter;
        const val   = chip.dataset.val;
        filters[group] = val;
        document.querySelectorAll(`.filter-chip[data-filter="${group}"]`)
          .forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        applyFilters();
      });
    });
  }

  /* ──── Marqueurs ──────────────────────────────────────── */

  function makeIcon(statut) {
    const color = STATUT_COLORS[statut];
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 28 28">
      <circle cx="14" cy="14" r="11" fill="${color}" stroke="white" stroke-width="2.5"/>
    </svg>`;
    return L.divIcon({ html: svg, className: '', iconSize: [28, 28], iconAnchor: [14, 14] });
  }

  function addMarker(p) {
    const m = L.marker([p.lat, p.lng], { icon: makeIcon(p.statut) }).addTo(map);
    m.on('click', () => openPopup(p));
    markers[p.id] = m;
  }

  /* ──── Géocodage inverse (Nominatim) ──────────────────── */

  async function fetchRealAddress(lat, lng) {
    const key = `${lat},${lng}`;
    if (geoCache[key] !== undefined) return geoCache[key];

    try {
      const res  = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=fr&zoom=18`
      );
      const data = await res.json();
      const a    = data.address || {};
      const rue  = [a.house_number, a.road || a.pedestrian || a.path]
                     .filter(Boolean).join(' ')
                || data.display_name?.split(',')[0]
                || null;
      geoCache[key] = rue;
      return rue;
    } catch {
      geoCache[key] = null;
      return null;
    }
  }

  /* ──── Popup enrichi ──────────────────────────────────── */

  function buildPopupHTML(p, rue) {
    const statLabel = STATUT_LABELS[p.statut];
    const taille    = TAILLE_LABELS[p.taille] || p.taille;
    const canBook   = p.statut === 'libre';
    const btnLabel  = canBook ? `Réserver (${RESERVE_COST} crédits)` : 'Indisponible';
    const disabled  = canBook ? '' : 'disabled';

    let distHtml = '';
    if (userLatLng) {
      const d = getDistance(userLatLng, [p.lat, p.lng]);
      distHtml = `<div class="popup-dist">À ${formatDist(d)} de vous</div>`;
    }

    return `
      <div class="popup-box">
        <div class="popup-title">Place #${p.id}</div>
        <div class="popup-addr">${rue}</div>
        ${distHtml}
        <div class="popup-tags">
          <span class="popup-status ${p.statut}">${statLabel}</span>
          <span class="popup-tag-taille">${taille}</span>
        </div>
        <div class="popup-price">Coût : ${p.prix} crédits / heure</div>
        <button class="popup-btn" ${disabled}
                onclick="WeePark.Map.reserve(${p.id})">${btnLabel}</button>
        <div class="popup-gps">
          <a class="popup-gps-btn"
             href="https://www.google.com/maps/dir/?api=1&destination=${p.lat},${p.lng}"
             target="_blank" rel="noopener">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                 width="13" height="13"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
            Google Maps
          </a>
          <a class="popup-gps-btn"
             href="https://waze.com/ul?ll=${p.lat},${p.lng}&navigate=yes"
             target="_blank" rel="noopener">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
                 width="13" height="13"><polygon points="3 11 22 2 13 21 11 13 3 11"/></svg>
            Waze
          </a>
        </div>
      </div>`;
  }

  function openPopup(p) {
    const popup = L.popup({ closeButton: true, maxWidth: 270 })
      .setLatLng([p.lat, p.lng])
      .setContent(buildPopupHTML(p, p.rue))
      .openOn(map);

    currentPopup = popup;

    fetchRealAddress(p.lat, p.lng).then(rue => {
      if (!rue || rue === p.rue) return;
      p.rue = rue;
      if (currentPopup === popup) {
        popup.setContent(buildPopupHTML(p, rue));
        popup.update();
      }
    });
  }

  /* ──── Réservation payante ────────────────────────────── */

  function reserve(id) {
    const p = WeePark.parkings.find(x => x.id === id);
    if (!p || p.statut !== 'libre') return;

    if (!WeePark.Credits.spend(RESERVE_COST)) {
      alert(`Crédits insuffisants. Il faut ${RESERVE_COST} crédits pour réserver.`);
      return;
    }

    p.statut = 'reservee';
    markers[id].setIcon(makeIcon('reservee'));
    updateCounts();
    applyFilters();
    map.closePopup();
    currentPopup = null;
    reservedId = id;
    startToast(RESERVE_SECONDS);

    speak(`Place réservée au ${p.rue}. Vous avez ${RESERVE_SECONDS / 60} minutes pour rejoindre votre place.`, true);
  }

  function startToast(seconds) {
    const toast   = document.getElementById('toast');
    const timerEl = document.getElementById('toast-timer');
    toast.classList.add('show');
    clearInterval(toastTimer);

    let s = seconds;
    timerEl.textContent = formatTime(s);

    toastTimer = setInterval(() => {
      s--;
      timerEl.textContent = formatTime(s);
      if (s <= 0) {
        clearInterval(toastTimer);
        toast.classList.remove('show');
        const p = WeePark.parkings.find(x => x.id === reservedId);
        if (p && p.statut === 'reservee') {
          p.statut = 'libre';
          markers[reservedId].setIcon(makeIcon('libre'));
          updateCounts();
          applyFilters();
          speak('Votre réservation a expiré. La place est à nouveau disponible.', true);
        }
      }
    }, 1000);
  }

  /* ──── Compteurs & simulation temps réel ──────────────── */

  function updateCounts() {
    const c = { libre: 0, occupee: 0, reservee: 0 };
    WeePark.parkings.forEach(p => c[p.statut]++);
    document.getElementById('count-libre').textContent = c.libre    + ' Libres';
    document.getElementById('count-occ').textContent   = c.occupee  + ' Occupées';
    document.getElementById('count-res').textContent   = c.reservee + ' Réservées';
  }

  function simulateChanges() {
    WeePark.parkings.forEach(p => {
      if (p.statut === 'reservee') return;
      if (Math.random() < 0.12) {
        p.statut = p.statut === 'libre' ? 'occupee' : 'libre';
        markers[p.id].setIcon(makeIcon(p.statut));
      }
    });
    updateCounts();
    applyFilters();
  }

  /* ──── Filtres ────────────────────────────────────────── */

  function applyFilters() {
    WeePark.parkings.forEach(p => {
      const ok = (filters.statut === 'all' || p.statut === filters.statut)
              && (filters.taille === 'all' || p.taille === filters.taille);
      if (ok) {
        if (!map.hasLayer(markers[p.id])) markers[p.id].addTo(map);
      } else {
        if (map.hasLayer(markers[p.id])) map.removeLayer(markers[p.id]);
      }
    });
  }

  function toggleFilterPanel() {
    const panel = document.getElementById('filter-panel');
    const bar   = document.getElementById('filter-bar');
    panel.classList.toggle('open');
    bar.classList.toggle('open');
  }

  /* ──── Géolocalisation ────────────────────────────────── */

  function locateUser() {
    if (!navigator.geolocation) {
      alert('Géolocalisation non supportée par ce navigateur.');
      return;
    }
    navigator.geolocation.getCurrentPosition(pos => {
      const { latitude: lat, longitude: lng } = pos.coords;
      userLatLng = [lat, lng];

      if (userMarker) map.removeLayer(userMarker);
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 20 20">
        <circle cx="10" cy="10" r="8" fill="#3b82f6" stroke="white" stroke-width="2.5"/>
        <circle cx="10" cy="10" r="3" fill="white"/>
      </svg>`;
      userMarker = L.marker([lat, lng], {
        icon: L.divIcon({ html: svg, className: '', iconSize: [20, 20], iconAnchor: [10, 10] }),
        zIndexOffset: 1000,
      }).addTo(map);

      map.setView([lat, lng], 16);
      checkProximity(lat, lng);

      if (guidanceOn) {
        const nearest = findNearestFree(lat, lng);
        if (nearest) {
          const dist = formatDistSpoken(getDistance([lat, lng], [nearest.lat, nearest.lng]));
          speak(`La place libre la plus proche est au ${nearest.rue}, à ${dist}.`, true);
          map.panTo([nearest.lat, nearest.lng]);
          setTimeout(() => openPopup(nearest), 600);
        } else {
          speak('Aucune place libre disponible pour le moment.', true);
        }
      }
    }, () => alert('Impossible d\'obtenir votre position.'));
  }

  function findNearestFree(lat, lng) {
    return WeePark.parkings
      .filter(p => p.statut === 'libre')
      .sort((a, b) =>
        getDistance([lat, lng], [a.lat, a.lng]) - getDistance([lat, lng], [b.lat, b.lng])
      )[0] || null;
  }

  function checkProximity(lat, lng) {
    WeePark.parkings
      .filter(p => p.statut === 'libre')
      .forEach(p => {
        const d = getDistance([lat, lng], [p.lat, p.lng]);
        if (d <= PROXIMITY_M) {
          openPopup(p);
          map.panTo([p.lat, p.lng]);
          speak(`Place libre à ${Math.round(d)} mètres, au ${p.rue} !`, true);
        }
      });
  }

  /* ──── Guidage vocal ──────────────────────────────────── */

  function toggleGuidance() {
    guidanceOn = !guidanceOn;
    const btn = document.getElementById('guidance-btn');
    btn.classList.toggle('active', guidanceOn);
    btn.title = guidanceOn
      ? 'Guidage vocal actif — cliquer pour désactiver'
      : 'Activer le guidage vocal';

    if (guidanceOn) {
      speak('Guidage vocal activé. Localisation en cours.', true);
      locateUser();
    } else {
      if ('speechSynthesis' in window) speechSynthesis.cancel();
    }
  }

  function speak(text, force = false) {
    if (!force && !guidanceOn) return;
    if (!('speechSynthesis' in window)) return;
    speechSynthesis.cancel();
    const u  = new SpeechSynthesisUtterance(text);
    u.lang   = 'fr-FR';
    u.rate   = 0.9;
    speechSynthesis.speak(u);
  }

  /* ──── Mise à jour depuis capteur ESP32 ───────────────── */

  function updateFromSensor(id, statut) {
    const p = WeePark.parkings.find(x => x.id === id);
    if (!p) return;
    p.statut = statut;
    if (markers[id]) markers[id].setIcon(makeIcon(statut));
    updateCounts();
    applyFilters();
  }

  /* ──── Utilitaires ────────────────────────────────────── */

  function getDistance([lat1, lng1], [lat2, lng2]) {
    const R  = 6371000;
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lng2 - lng1) * Math.PI / 180;
    const a  = Math.sin(Δφ / 2) ** 2
             + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  function formatDist(m) {
    return m < 1000 ? `${Math.round(m)} m` : `${(m / 1000).toFixed(1)} km`;
  }

  function formatDistSpoken(m) {
    return m < 1000
      ? `${Math.round(m)} mètres`
      : `${(m / 1000).toFixed(1)} kilomètres`;
  }

  function formatTime(s) {
    return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0');
  }

  return { init, ensureInit: init, reserve, updateFromSensor };
})();
