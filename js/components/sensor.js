/* ============================================================
   Capteur ESP32C3 — Web Serial API
   Lit le JSON envoyé par l'ESP32 via USB et met à jour la carte
   ============================================================ */

window.WeePark = window.WeePark || {};

WeePark.Sensor = (function () {
  let port   = null;
  let reader = null;

  async function connect() {
    if (!('serial' in navigator)) {
      alert(
        'Web Serial non supporté.\n' +
        'Utilise Chrome ou Edge, et lance le site via :\n' +
        'python -m http.server 8080  →  http://localhost:8080'
      );
      return;
    }

    try {
      port = await navigator.serial.requestPort();
      await port.open({ baudRate: 9600, bufferSize: 8192 });
      setConnected(true);
      readLoop();
    } catch (e) {
      if (e.name !== 'NotFoundError') alert('Connexion échouée : ' + e.message);
    }
  }

  async function disconnect() {
    try {
      if (reader) { await reader.cancel(); reader = null; }
      if (port)   { await port.close();    port   = null; }
    } catch (_) {}
    setConnected(false);
  }

  async function readLoop() {
    const dec = new TextDecoder();
    let buf = '';

    while (port && port.readable) {
      try {
        reader = port.readable.getReader();
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;

          const chunk = dec.decode(value, { stream: true });
          console.log('[ESP32 raw]', JSON.stringify(chunk), '(' + value.length + ' octets)');

          buf += chunk;
          const lines = buf.split('\n');
          buf = lines.pop();

          for (const line of lines) {
            const trimmed = line.trim();
            if (!trimmed) continue;
            console.log('[ESP32 ligne]', trimmed);

            const matches = trimmed.matchAll(/Place\s+(\d+)\s*:\s*(OCCUPEE|VIDE)/gi);
            for (const m of matches) {
              const id     = parseInt(m[1], 10);
              const statut = m[2].toUpperCase() === 'OCCUPEE' ? 'occupee' : 'libre';
              WeePark.Map.updateFromSensor(id, statut);
            }
          }
        }
      } catch (e) {
        if (e.name === 'AbortError') break;
        console.warn('Lecture interrompue, on retente :', e.message);
      } finally {
        try { if (reader) reader.releaseLock(); } catch (_) {}
      }
    }
    setConnected(false);
  }

  function toggle() {
    if (port) disconnect();
    else      connect();
  }

  function setConnected(on) {
    const btn   = document.getElementById('sensor-btn');
    const badge = document.getElementById('live-badge');
    if (btn)   btn.classList.toggle('connected', on);
    if (badge) badge.style.display = on ? 'flex' : 'none';
    if (btn)   btn.title = on
      ? 'Capteur connecté — cliquer pour déconnecter'
      : 'Connecter le capteur ESP32';
  }

  function init() {
    const btn = document.getElementById('sensor-btn');
    if (btn) btn.addEventListener('click', toggle);
  }

  return { init };
})();
