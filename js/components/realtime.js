/* ============================================================
   Realtime — Souscription au channel Supabase
   - SELECT initial pour synchroniser l'état au chargement
   - Abonnement aux UPDATE pour temps réel
   - Re-sync auto sur reconnexion
   ============================================================ */

window.WeePark = window.WeePark || {};

WeePark.Realtime = (function () {
  let channel = null;
  let isInitialized = false;

  async function syncInitialState() {
    const { data, error } = await WeePark.db
      .from('parking_spots')
      .select('id, statut, reserved_until');

    if (error) {
      console.error('[WeePark] Erreur SELECT initial:', error.message);
      setCloudBadge(false);
      return;
    }

    console.log(`[WeePark] Supabase connecté, ${data.length} spots reçus`);
    data.forEach(row => WeePark.Map.updateFromSensor(row.id, row.statut));
    setCloudBadge(true);
  }

  function subscribeToChanges() {
    if (channel) {
      WeePark.db.removeChannel(channel);
    }

    channel = WeePark.db
      .channel('parking_spots_changes')
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'parking_spots' },
        payload => {
          const row = payload.new;
          WeePark.Map.updateFromSensor(row.id, row.statut);
        }
      )
      .subscribe(status => {
        console.log('[WeePark] Realtime status:', status);
        if (status === 'SUBSCRIBED') {
          setCloudBadge(true);
          // Resync après chaque (re)connexion pour rattraper les events manqués
          if (isInitialized) syncInitialState();
          isInitialized = true;
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
          setCloudBadge(false);
        }
      });
  }

  function setCloudBadge(connected) {
    const badge = document.getElementById('cloud-badge');
    if (!badge) return;
    badge.classList.toggle('connected', connected);
    badge.title = connected ? 'Cloud connecté' : 'Cloud déconnecté';
  }

  async function init() {
    await syncInitialState();
    subscribeToChanges();
  }

  return { init };
})();
