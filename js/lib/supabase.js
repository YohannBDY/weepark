/* ============================================================
   Client Supabase — initialisation unique
   Expose WeePark.db pour les autres modules
   ============================================================ */

window.WeePark = window.WeePark || {};

(function () {
  const SUPABASE_URL      = 'https://pxwvpdsdyaywikpwolbe.supabase.co';
  const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB4d3ZwZHNkeWF5d2lrcHdvbGJlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAzMTMzNDYsImV4cCI6MjA5NTg4OTM0Nn0.0FUPNe4ZHHIF1ookg76AT7E4XD2Rxf4Y5DDM-xB1u2w';

  // Le SDK Supabase est chargé via CDN dans index.html → expose window.supabase
  WeePark.db = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    realtime: { params: { eventsPerSecond: 10 } },
  });

  console.log('[WeePark] Client Supabase initialisé');
})();
