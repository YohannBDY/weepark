/* ============================================================
   Point d'entrée — initialisation des modules au chargement
   ============================================================ */

window.addEventListener('load', async () => {
  WeePark.Navigation.init();
  WeePark.Credits.init();
  WeePark.Louer.init();
  WeePark.Ads.init();
  WeePark.Dashboard.init();
  WeePark.Stats.init();
  WeePark.Map.init();
  WeePark.Sensor.init();
  await WeePark.Realtime.init();

  lucide.createIcons();
});
