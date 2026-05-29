# WeePark Showroom Demo — Plan d'implémentation

> **Pour agents IA :** SKILL REQUIS : `superpowers:subagent-driven-development` (recommandé) ou `superpowers:executing-plans` pour exécuter ce plan tâche par tâche. Les étapes utilisent la syntaxe checkbox (`- [ ]`) pour le suivi.

**Goal :** Connecter la maquette ESP32 à des téléphones de visiteurs en temps réel via Supabase, déployé sur Vercel, pour la démo du showroom du 04/06/2026.

**Architecture :** Bridge dans Chrome sur le PC du stand qui lit Web Serial et UPDATE une table Supabase ; tous les autres clients (téléphones via QR code) s'abonnent au channel Realtime et reçoivent les mises à jour. La DB est la source de vérité unique pour l'état des places.

**Tech Stack :** Vanilla JS (pas de build), Supabase JS SDK via CDN, Leaflet (déjà présent), Vercel (déploiement), GitHub (versioning).

**Spec de référence :** `docs/superpowers/specs/2026-05-29-showroom-demo-design.md`

---

## ⚠️ Avant de commencer

Lire intégralement le **spec** pour comprendre le contexte, les décisions et les flows. Ce plan suppose que tu connais le contenu du spec.

**Pas de framework de test** dans ce projet. Chaque tâche se termine par une **vérification manuelle concrète** (les "Niveau 1 — Tests par étape" du spec Section 7). Cliquer, regarder, valider.

**Tu travailles dans le dossier** `C:\Users\yohan\OneDrive\0. ESILV\P2IP\Weepark Code`.

---

## Task 0 : Setup des comptes externes (à faire en premier)

**Files :** Aucun fichier de code modifié, mais on récupère 3 secrets à noter quelque part en sécurité (pas dans Git).

### Step 1 — Créer le compte GitHub perso (si pas déjà fait)

- [ ] Aller sur https://github.com/signup
- [ ] Créer un compte avec ton email perso (PAS celui de ton business pro)
- [ ] Vérifier l'email

### Step 2 — Créer un repo GitHub pour WeePark

- [ ] Sur GitHub, cliquer "+" en haut à droite → "New repository"
- [ ] Nom : `weepark` (ou `weepark-showroom`, peu importe)
- [ ] Description : `Stationnement intelligent — projet ESILV`
- [ ] Visibilité : **Public** (nécessaire pour le tier gratuit Vercel le plus permissif)
- [ ] **NE PAS** cocher "Add a README", "Add .gitignore", "Add license" (on a déjà tout en local)
- [ ] Cliquer "Create repository"
- [ ] Sur la page suivante, **copier l'URL** du repo (genre `https://github.com/TON_USER/weepark.git`)

### Step 3 — Push le code local vers GitHub

```bash
git remote add origin https://github.com/TON_USER/weepark.git
git push -u origin main
```

- [ ] Exécuter ces 2 commandes (remplacer `TON_USER` par ton username GitHub)
- [ ] Si GitHub demande une auth, suivre les instructions (token perso ou login)
- [ ] Vérifier sur github.com que le code est bien là

### Step 4 — Créer le compte Supabase

- [ ] Aller sur https://supabase.com → "Start your project"
- [ ] S'inscrire avec ton email perso (pas pro)
- [ ] Pas de carte bancaire demandée pour le tier gratuit ✓

### Step 5 — Créer un projet Supabase

- [ ] Cliquer "New project"
- [ ] Organization : par défaut (Personal)
- [ ] Project name : `weepark`
- [ ] Database password : **générer un mot de passe fort** et le sauvegarder (tu n'en auras pas besoin pour cette démo mais c'est obligatoire à la création)
- [ ] Region : **West EU (Ireland)** ou **Central EU (Frankfurt)** — au plus proche de Paris pour minimiser la latence
- [ ] Plan : Free
- [ ] Cliquer "Create new project" → attendre 1-2 min que le projet provisionne

### Step 6 — Récupérer URL + clé anon Supabase

- [ ] Dans le dashboard Supabase, panneau gauche → **Project Settings** (icône engrenage) → **API**
- [ ] Noter dans un fichier temporaire (pas dans le repo !) :
  - `Project URL` : genre `https://xxxxxxxxxxxx.supabase.co`
  - `Project API keys → anon public` : un long JWT qui commence par `eyJ...`
- [ ] Ces 2 valeurs serviront dans la Task 2

### Step 7 — Créer le compte Vercel

- [ ] Aller sur https://vercel.com → "Sign Up"
- [ ] Choisir "Continue with GitHub" (pratique : ça lie ton compte direct)
- [ ] Autoriser Vercel à accéder à ton GitHub
- [ ] Plan : Hobby (gratuit)

### Step 8 — Vérifier que tout est prêt

- [ ] Tu as l'URL Supabase notée quelque part
- [ ] Tu as la clé `anon` Supabase notée
- [ ] Tu vois ton repo `weepark` sur GitHub avec tes 2 commits actuels
- [ ] Tu es connecté à Vercel

**Pas de commit pour cette tâche** — c'est du setup hors code.

---

## Task 1 : Schéma Supabase

**Files :**
- Créer : `supabase/schema.sql`
- Action externe : exécuter le SQL dans le Supabase SQL Editor

### Step 1 — Créer le fichier `supabase/schema.sql`

Créer ce fichier avec exactement ce contenu :

```sql
-- ============================================================
-- WeePark — Schema Supabase
-- Une seule table parking_spots, source de vérité de l'état
-- des 40 places de parking.
-- ============================================================

-- Table principale
CREATE TABLE parking_spots (
  id              integer PRIMARY KEY,
  statut          text NOT NULL CHECK (statut IN ('libre', 'occupee', 'reservee')),
  reserved_until  timestamptz,
  updated_at      timestamptz NOT NULL DEFAULT now()
);

-- Row Level Security : tout le monde peut lire et updater (acceptable pour la démo)
ALTER TABLE parking_spots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anyone can read" ON parking_spots
  FOR SELECT TO anon USING (true);

CREATE POLICY "anyone can update" ON parking_spots
  FOR UPDATE TO anon USING (true) WITH CHECK (true);

-- Seed initial : 40 places avec leurs statuts initiaux (copiés de parkings.js)
INSERT INTO parking_spots (id, statut) VALUES
  (1, 'libre'),    (2, 'occupee'),  (3, 'libre'),    (4, 'libre'),
  (5, 'occupee'),  (6, 'reservee'), (7, 'occupee'),  (8, 'libre'),
  (9, 'reservee'), (10, 'occupee'), (11, 'libre'),   (12, 'libre'),
  (13, 'occupee'), (14, 'libre'),   (15, 'occupee'), (16, 'libre'),
  (17, 'occupee'), (18, 'libre'),   (19, 'occupee'), (20, 'libre'),
  (21, 'libre'),   (22, 'occupee'), (23, 'libre'),   (24, 'occupee'),
  (25, 'libre'),   (26, 'reservee'),(27, 'libre'),   (28, 'occupee'),
  (29, 'libre'),   (30, 'libre'),   (31, 'occupee'), (32, 'libre'),
  (33, 'libre'),   (34, 'occupee'), (35, 'occupee'), (36, 'libre'),
  (37, 'occupee'), (38, 'libre'),   (39, 'occupee'), (40, 'libre');
```

- [ ] Créer le dossier `supabase/` et le fichier `schema.sql` avec ce contenu

### Step 2 — Exécuter le SQL dans Supabase

- [ ] Aller sur le dashboard Supabase → panneau gauche → **SQL Editor**
- [ ] Cliquer "+ New query"
- [ ] Copier-coller TOUT le contenu de `supabase/schema.sql`
- [ ] Cliquer "Run" (Ctrl+Entrée)
- [ ] Vérifier le message de succès en bas

### Step 3 — Activer Realtime sur la table

- [ ] Panneau gauche → **Database** → **Replication**
- [ ] Trouver la ligne `parking_spots`
- [ ] Activer le toggle pour les events `UPDATE` (cocher la case)
- [ ] Sauvegarder si nécessaire

### Step 4 — Vérification manuelle

- [ ] Panneau gauche → **Table Editor** → cliquer sur `parking_spots`
- [ ] Vérifier : 40 lignes présentes
- [ ] Tester la contrainte CHECK : SQL Editor → exécuter `UPDATE parking_spots SET statut = 'nawak' WHERE id = 1;` → doit échouer avec une erreur de contrainte

### Step 5 — Commit

```bash
git add supabase/schema.sql
git commit -m "Add Supabase schema for parking_spots table"
git push
```

- [ ] Exécuter ces commandes
- [ ] Vérifier sur GitHub que le commit est bien là

---

## Task 2 : Client Supabase frontend

**Files :**
- Modifier : `index.html` (ajout de 2 scripts)
- Créer : `js/lib/supabase.js`

### Step 1 — Créer le fichier `js/lib/supabase.js`

Créer ce fichier avec ce contenu, en remplaçant les 2 placeholders par les valeurs notées dans la Task 0 Step 6 :

```javascript
/* ============================================================
   Client Supabase — initialisation unique
   ============================================================ */

window.WeePark = window.WeePark || {};

(function () {
  const SUPABASE_URL      = 'https://xxxxxxxxxxxx.supabase.co';  // ← remplacer par ton URL
  const SUPABASE_ANON_KEY = 'eyJ...';                            // ← remplacer par ta clé anon

  // Le SDK Supabase est chargé via CDN dans index.html → expose window.supabase
  WeePark.db = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    realtime: { params: { eventsPerSecond: 10 } },
  });

  console.log('[WeePark] Client Supabase initialisé');
})();
```

- [ ] Créer le dossier `js/lib/` et le fichier `supabase.js`
- [ ] **Remplacer `SUPABASE_URL` et `SUPABASE_ANON_KEY` par tes vraies valeurs**

### Step 2 — Ajouter le SDK Supabase + le fichier dans `index.html`

Dans `index.html`, trouver la ligne :

```html
<script src="https://unpkg.com/lucide@latest"></script>
```

Et ajouter juste APRÈS :

```html
<!-- Supabase JS SDK -->
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
```

Puis trouver le bloc des scripts en bas de page :

```html
<script src="js/data/parkings.js"></script>
```

Et ajouter juste AVANT :

```html
<script src="js/lib/supabase.js"></script>
```

L'ordre est important : le SDK Supabase doit être chargé avant `js/lib/supabase.js`, qui doit être chargé avant les modules qui l'utilisent.

- [ ] Faire les 2 ajouts dans `index.html`

### Step 3 — Vérification manuelle

- [ ] Ouvrir `index.html` dans Chrome (via Live Server VS Code de préférence, sinon double-clic)
- [ ] Ouvrir la console (F12 → Console)
- [ ] Vérifier qu'on voit `[WeePark] Client Supabase initialisé`
- [ ] Vérifier qu'il n'y a **AUCUNE erreur rouge** dans la console
- [ ] Si erreur "Cannot read property of undefined" → mauvais ordre des scripts, vérifier l'index.html
- [ ] Si erreur Supabase → mauvaise URL/clé, re-vérifier les valeurs

### Step 4 — Commit

```bash
git add index.html js/lib/supabase.js
git commit -m "Add Supabase client initialization"
git push
```

- [ ] Exécuter ces commandes

**Note importante** : les clés Supabase `anon` sont conçues pour être publiques (c'est par design — les vraies protections sont dans les RLS policies côté serveur). Pas besoin de les cacher dans un `.env` pour cette démo.

---

## Task 3 : Subscription Realtime (lecture seule)

**Files :**
- Créer : `js/components/realtime.js`
- Modifier : `index.html` (ajout du script + badge Cloud)
- Modifier : `js/app.js` (init du module Realtime)
- Modifier : `js/views/map.js` (retirer le early-return sur 'reservee' dans updateFromSensor)
- Modifier : `css/map.css` (style du badge Cloud)

### Step 1 — Modifier `js/views/map.js` : retirer le early-return sur 'reservee'

Trouver dans `js/views/map.js` la fonction `updateFromSensor` (vers ligne 368) :

```javascript
function updateFromSensor(id, statut) {
    const p = WeePark.parkings.find(x => x.id === id);
    if (!p || p.statut === 'reservee') return;
    p.statut = statut;
    if (markers[id]) markers[id].setIcon(makeIcon(statut));
    updateCounts();
    applyFilters();
  }
```

Remplacer par :

```javascript
function updateFromSensor(id, statut) {
    const p = WeePark.parkings.find(x => x.id === id);
    if (!p) return;
    p.statut = statut;
    if (markers[id]) markers[id].setIcon(makeIcon(statut));
    updateCounts();
    applyFilters();
  }
```

**Pourquoi :** maintenant Supabase est la source de vérité, donc un statut 'reservee' venant du serveur est légitime et doit être appliqué. L'ancienne garde empêchait ça.

- [ ] Faire la modification

### Step 2 — Créer `js/components/realtime.js`

```javascript
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
          // Resync après chaque (re)connexion pour rattraper d'éventuels events manqués
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
```

- [ ] Créer le fichier `js/components/realtime.js` avec ce contenu

### Step 3 — Ajouter le badge Cloud dans `index.html`

Trouver la ligne contenant le badge "Capteur en direct" (vers ligne 69) :

```html
<div class="status-item live-badge" id="live-badge" style="display:none">
        <span class="dot dot-live"></span><span>Capteur en direct</span>
      </div>
```

Remplacer par :

```html
<div class="status-item live-badge" id="live-badge" style="display:none">
        <span class="dot dot-live"></span><span>Capteur en direct</span>
      </div>
      <div class="status-item cloud-badge" id="cloud-badge">
        <span class="dot dot-cloud"></span><span>Cloud connecté</span>
      </div>
```

- [ ] Faire la modification

### Step 4 — Ajouter le style du badge Cloud dans `css/map.css`

D'abord, ouvrir `css/map.css` pour voir comment `dot-live` est stylé. Chercher `.dot-live` dans le fichier. Tu vas trouver quelque chose comme `.dot-live { background: #...; }`.

Ajouter à la fin du fichier `css/map.css` :

```css
/* Badge Cloud connecté */
.cloud-badge {
  opacity: 0.4;
  transition: opacity 0.3s;
}
.cloud-badge.connected {
  opacity: 1;
}
.dot-cloud {
  background: #3b82f6;
  box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.6);
  animation: pulse-cloud 2s infinite;
}
.cloud-badge:not(.connected) .dot-cloud {
  background: #94a3b8;
  animation: none;
}
@keyframes pulse-cloud {
  0%   { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.6); }
  70%  { box-shadow: 0 0 0 8px rgba(59, 130, 246, 0); }
  100% { box-shadow: 0 0 0 0 rgba(59, 130, 246, 0); }
}
```

- [ ] Ajouter ces règles CSS

### Step 5 — Ajouter le script dans `index.html`

Dans `index.html`, trouver :

```html
<script src="js/components/sensor.js"></script>
```

Ajouter juste APRÈS :

```html
<script src="js/components/realtime.js"></script>
```

- [ ] Faire la modification

### Step 6 — Initialiser le module dans `js/app.js`

Remplacer le contenu actuel de `js/app.js` :

```javascript
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
```

- [ ] Remplacer le contenu de `js/app.js`

**Note :** `WeePark.Realtime.init()` est `await`-é car le SELECT initial doit terminer avant qu'on considère l'app prête. La carte s'affiche déjà avant (Map.init()), puis se met à jour quand le SELECT revient.

### Step 7 — Vérification manuelle (Niveau 1 — Étape B du spec)

- [ ] Recharger la page dans Chrome
- [ ] Console : voir `[WeePark] Client Supabase initialisé`, puis `Supabase connecté, 40 spots reçus`, puis `Realtime status: SUBSCRIBED`
- [ ] Le badge "Cloud connecté" (bleu) est visible et "lumineux" en haut
- [ ] Les couleurs des markers correspondent à l'état en DB (cf. seed Task 1)
- [ ] **Test critique** : aller dans Supabase SQL Editor → exécuter `UPDATE parking_spots SET statut = 'occupee' WHERE id = 1;` → le marker #1 doit passer en rouge dans Chrome en <2s
- [ ] Refaire l'inverse pour remettre place #1 libre : `UPDATE parking_spots SET statut = 'libre' WHERE id = 1;` → marker repasse en vert
- [ ] **Test de reconnexion** : couper le WiFi/Ethernet du PC, attendre 5s, badge Cloud doit devenir gris/pâle ; remettre le WiFi → badge redevient bleu vif après ~3s

### Step 8 — Commit

```bash
git add index.html css/map.css js/lib/supabase.js js/components/realtime.js js/views/map.js js/app.js
git commit -m "Add Supabase realtime subscription with cloud connectivity badge"
git push
```

- [ ] Exécuter ces commandes

---

## Task 4 : Bridge — push des events capteur vers Supabase

**Files :**
- Modifier : `js/components/sensor.js`

### Step 1 — Réécrire `js/components/sensor.js`

Remplacer **entièrement** le contenu actuel de `js/components/sensor.js` :

```javascript
/* ============================================================
   Capteur ESP32C3 — Web Serial API + Bridge vers Supabase
   Lit le JSON envoyé par l'ESP32 via USB et UPDATE Supabase.
   La diffusion aux clients se fait via le Realtime channel.
   ============================================================ */

window.WeePark = window.WeePark || {};

WeePark.Sensor = (function () {
  let port      = null;
  let reader    = null;
  let connected = false;

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
      await port.open({ baudRate: 115200 });
      connected = true;
      setConnected(true);
      WeePark.Bridge?.start();
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
    connected = false;
    setConnected(false);
    WeePark.Bridge?.stop();
  }

  async function readLoop() {
    const dec = new TextDecoder();
    let buf = '';

    try {
      reader = port.readable.getReader();
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buf += dec.decode(value, { stream: true });
        const lines = buf.split('\n');
        buf = lines.pop();

        for (const line of lines) {
          try {
            const data = JSON.parse(line.trim());
            if (data.id !== undefined && data.statut) {
              await pushToSupabase(data.id, data.statut);
            }
          } catch (_) {}
        }
      }
    } catch (e) {
      if (e.name !== 'AbortError') console.warn('Capteur déconnecté :', e.message);
    } finally {
      connected = false;
      setConnected(false);
      WeePark.Bridge?.stop();
    }
  }

  async function pushToSupabase(id, statut) {
    const { error } = await WeePark.db
      .from('parking_spots')
      .update({ statut, updated_at: new Date().toISOString() })
      .eq('id', id);
    if (error) console.warn(`[Sensor] UPDATE échoué pour id=${id}:`, error.message);
  }

  function toggle() {
    if (port) disconnect();
    else      connect();
  }

  function isConnected() {
    return connected;
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

  return { init, isConnected };
})();
```

**Changements clés vs version précédente :**
- `pushToSupabase()` remplace l'appel direct à `WeePark.Map.updateFromSensor()` — c'est le Realtime channel qui mettra à jour la carte (y compris sur ce navigateur, via la subscription de la Task 3)
- Appels à `WeePark.Bridge.start()` / `.stop()` quand on connecte/déconnecte (le module Bridge sera créé en Task 5)
- Expose `isConnected()` pour que d'autres modules sachent si on est le bridge

- [ ] Remplacer le contenu de `js/components/sensor.js`

### Step 2 — Vérification manuelle (Niveau 1 — Étape C du spec)

- [ ] Recharger la page dans Chrome
- [ ] Cliquer sur le bouton capteur (icône wifi en bas à droite de la carte)
- [ ] Sélectionner le port série de l'ESP32 dans la boîte de dialogue
- [ ] Console : pas d'erreur
- [ ] Le badge "Capteur en direct" apparaît
- [ ] Mettre un aimant sur la place #1 de la maquette
- [ ] Aller dans Supabase Table Editor → vérifier que `parking_spots.id=1` a son `statut` qui a changé
- [ ] Le marker #1 sur la carte Chrome est passé en rouge (via la subscription Realtime)
- [ ] Ouvrir un **2ème onglet** Chrome sur le même site (sans connecter le capteur cette fois)
- [ ] Manipuler l'aimant → les 2 onglets se mettent à jour simultanément

**Si ça ne marche pas :**
- Pas d'update en DB → vérifier que la console n'affiche pas d'erreur RLS, vérifier que les policies sont bien créées
- Update en DB mais pas dans Chrome → vérifier que `Realtime status: SUBSCRIBED` dans la console (Task 3)

### Step 3 — Commit

```bash
git add js/components/sensor.js
git commit -m "Bridge sensor events to Supabase instead of direct DOM updates"
git push
```

- [ ] Exécuter ces commandes

---

## Task 5 : Bridge — simulation centralisée + cleanup réservations

**Files :**
- Créer : `js/components/bridge.js`
- Modifier : `index.html` (ajout du script)
- Modifier : `js/views/map.js` (retrait du simulateChanges global)
- Modifier : `js/app.js` (init du Bridge)

### Step 1 — Créer `js/components/bridge.js`

```javascript
/* ============================================================
   Bridge — actif uniquement sur le PC du stand (Web Serial connecté)
   Responsabilités :
   1. Simuler aléatoirement les places NON-physiques (IDs 7-40)
   2. Cleaner les réservations expirées toutes les 10s
   ============================================================ */

window.WeePark = window.WeePark || {};

WeePark.Bridge = (function () {
  const PHYSICAL_IDS    = [1, 2, 3, 4, 5, 6];
  const SIM_INTERVAL_MS = 5000;
  const CLEAN_INTERVAL_MS = 10000;

  let simTimer  = null;
  let cleanTimer = null;

  function start() {
    console.log('[Bridge] Démarrage : simulation + cleanup réservations');
    if (simTimer)  clearInterval(simTimer);
    if (cleanTimer) clearInterval(cleanTimer);
    simTimer   = setInterval(simulateOneSpot, SIM_INTERVAL_MS);
    cleanTimer = setInterval(cleanupReservations, CLEAN_INTERVAL_MS);
  }

  function stop() {
    console.log('[Bridge] Arrêt');
    if (simTimer)  { clearInterval(simTimer);  simTimer  = null; }
    if (cleanTimer) { clearInterval(cleanTimer); cleanTimer = null; }
  }

  async function simulateOneSpot() {
    // Choisit une place non-physique, non-réservée, et inverse son statut libre↔occupee
    const candidates = WeePark.parkings.filter(p =>
      !PHYSICAL_IDS.includes(p.id) && p.statut !== 'reservee'
    );
    if (candidates.length === 0) return;

    const target = candidates[Math.floor(Math.random() * candidates.length)];
    const newStatut = target.statut === 'libre' ? 'occupee' : 'libre';

    const { error } = await WeePark.db
      .from('parking_spots')
      .update({ statut: newStatut, updated_at: new Date().toISOString() })
      .eq('id', target.id);
    if (error) console.warn(`[Bridge] Sim UPDATE id=${target.id} échoué:`, error.message);
  }

  async function cleanupReservations() {
    const { error } = await WeePark.db
      .from('parking_spots')
      .update({ statut: 'libre', reserved_until: null, updated_at: new Date().toISOString() })
      .eq('statut', 'reservee')
      .lt('reserved_until', new Date().toISOString());
    if (error) console.warn('[Bridge] Cleanup réservations échoué:', error.message);
  }

  return { start, stop };
})();
```

- [ ] Créer le fichier `js/components/bridge.js` avec ce contenu

### Step 2 — Ajouter le script dans `index.html`

Trouver dans `index.html` :

```html
<script src="js/components/realtime.js"></script>
```

Ajouter juste APRÈS :

```html
<script src="js/components/bridge.js"></script>
```

- [ ] Faire la modification

### Step 3 — Retirer le `simulateChanges` global de `js/views/map.js`

Dans `js/views/map.js`, trouver dans la fonction `init()` (vers ligne 62) :

```javascript
setInterval(simulateChanges, 5000);
```

**Supprimer cette ligne.** La simulation est désormais centralisée dans `bridge.js`.

- [ ] Supprimer la ligne

**Note** : tu peux laisser la fonction `simulateChanges()` définie plus bas dans le fichier (lignes 246-256), elle ne sera juste plus appelée. C'est plus safe que de la supprimer (au cas où d'autres modules y feraient référence).

### Step 4 — Vérification manuelle (Niveau 1 — Étape D du spec)

- [ ] Recharger la page dans Chrome
- [ ] **Sans connecter le capteur** : observer pendant 30 secondes → aucun marker ne doit bouger
- [ ] Console : pas de message "[Bridge]"
- [ ] **Connecter le capteur** (bouton wifi → sélectionner port)
- [ ] Console : voir `[Bridge] Démarrage : simulation + cleanup réservations`
- [ ] Attendre 10 secondes → des markers parmi les IDs 7-40 commencent à changer toutes les 5s
- [ ] **Test crucial** : les markers IDs 1-6 ne changent que si tu touches la maquette (jamais via la simulation)
- [ ] **Test multi-onglets** : ouvrir un 2ème onglet (sans capteur), les changements de simulation sont visibles dans LES DEUX onglets simultanément
- [ ] **Déconnecter le capteur** (re-cliquer le bouton wifi) → console : `[Bridge] Arrêt` → la simulation s'arrête

### Step 5 — Commit

```bash
git add index.html js/components/bridge.js js/views/map.js
git commit -m "Centralize simulation in Bridge module, active only on PC with Web Serial"
git push
```

- [ ] Exécuter ces commandes

---

## Task 6 : Réservations atomiques via Supabase

**Files :**
- Modifier : `js/views/map.js` (réécrire `reserve()` et le timer d'expiration)

### Step 1 — Modifier la fonction `reserve()` dans `js/views/map.js`

Trouver dans `js/views/map.js` la fonction `reserve(id)` (vers lignes 188-207) :

```javascript
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
```

Remplacer **entièrement** par :

```javascript
async function reserve(id) {
    const p = WeePark.parkings.find(x => x.id === id);
    if (!p || p.statut !== 'libre') return;

    if (!WeePark.Credits.spend(RESERVE_COST)) {
      alert(`Crédits insuffisants. Il faut ${RESERVE_COST} crédits pour réserver.`);
      return;
    }

    // UPDATE atomique : ne réussit que si la place est encore 'libre' à l'instant T
    const reservedUntil = new Date(Date.now() + RESERVE_SECONDS * 1000).toISOString();
    const { data, error } = await WeePark.db
      .from('parking_spots')
      .update({ statut: 'reservee', reserved_until: reservedUntil, updated_at: new Date().toISOString() })
      .eq('id', id)
      .eq('statut', 'libre')
      .select();

    if (error) {
      console.error('[Reserve] Erreur Supabase:', error.message);
      WeePark.Credits.add(RESERVE_COST); // remboursement
      alert('Erreur de connexion, réessaie dans quelques secondes.');
      return;
    }

    if (!data || data.length === 0) {
      // Race condition perdue : un autre visiteur a réservé 0.1s avant
      WeePark.Credits.add(RESERVE_COST); // remboursement
      alert('Désolé, cette place vient juste d\'être réservée par quelqu\'un d\'autre.');
      return;
    }

    // Succès : le marker passe en orange via le Realtime callback (updateFromSensor)
    map.closePopup();
    currentPopup = null;
    reservedId = id;
    startToast(RESERVE_SECONDS);

    speak(`Place réservée au ${p.rue}. Vous avez ${RESERVE_SECONDS / 60} minutes pour rejoindre votre place.`, true);
  }
```

**Changements clés :**
- Fonction `async`
- L'UPDATE Supabase est atomique grâce au `.eq('statut', 'libre')` (le `WHERE statut='libre'` SQL)
- Si 0 ligne retournée → race perdue → remboursement
- On ne touche plus directement à `p.statut` ni au marker : c'est le Realtime callback qui s'en charge
- En cas d'erreur réseau, remboursement aussi

- [ ] Remplacer la fonction `reserve()`

### Step 2 — Modifier le timer d'expiration dans `startToast()`

Trouver dans `js/views/map.js` la fonction `startToast(seconds)` (vers lignes 209-234) :

```javascript
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
```

Remplacer **entièrement** par :

```javascript
function startToast(seconds) {
    const toast   = document.getElementById('toast');
    const timerEl = document.getElementById('toast-timer');
    toast.classList.add('show');
    clearInterval(toastTimer);

    let s = seconds;
    timerEl.textContent = formatTime(s);

    toastTimer = setInterval(async () => {
      s--;
      timerEl.textContent = formatTime(s);
      if (s <= 0) {
        clearInterval(toastTimer);
        toast.classList.remove('show');
        // Best-effort : libère la place en DB. Idempotent avec le cleanup du Bridge.
        // Si on est le bridge, on a probablement déjà fait le cleanup ; si on est un visiteur,
        // ce UPDATE est notre filet de sécurité.
        if (reservedId) {
          await WeePark.db
            .from('parking_spots')
            .update({ statut: 'libre', reserved_until: null, updated_at: new Date().toISOString() })
            .eq('id', reservedId)
            .eq('statut', 'reservee');
        }
        speak('Votre réservation a expiré. La place est à nouveau disponible.', true);
        reservedId = null;
      }
    }, 1000);
  }
```

**Changements clés :**
- On ne modifie plus l'état local directement à l'expiration — c'est la DB qui décide, le Realtime propage
- L'UPDATE en DB est idempotent (si déjà fait par le cleanup du Bridge, ce UPDATE met 0 ligne à jour, pas grave)
- Le `eq('statut', 'reservee')` évite d'écraser une éventuelle nouvelle réservation par un autre user (extrêmement improbable mais propre)

- [ ] Remplacer la fonction `startToast()`

### Step 3 — Vérification manuelle (Niveau 1 — Étape E du spec)

- [ ] Recharger la page dans Chrome
- [ ] Ouvrir un 2ème onglet sur le même site
- [ ] Connecter le capteur dans l'onglet 1 (pour faire tourner le bridge et son cleanup)
- [ ] Dans l'onglet 1, cliquer sur une place verte → "Réserver" → marker passe en orange dans les 2 onglets, toast avec timer 3:00 dans onglet 1 uniquement
- [ ] Vérifier que les crédits ont diminué de 5 dans onglet 1
- [ ] **Test race condition** : sur une place verte, ouvrir les 2 onglets, préparer "Réserver" sur la même place, cliquer en rafale → 1 seul succeed, l'autre voit le toast "déjà réservée" + crédits remboursés
- [ ] **Test expiration auto** : réserver une place, attendre 3 minutes → la place doit repasser libre dans les 2 onglets, message vocal "votre réservation a expiré"
- [ ] **Test cleanup bridge** : réserver une place, fermer l'onglet 1 (le bridge meurt), garder seulement l'onglet 2 ouvert (sans bridge) → la place repassera libre après ~3 min car le bridge n'est plus là, c'est le timer local du tab 1 qui aurait fait le filet... mais comme tab 1 est fermé, vérifier que le 2 fait la même chose. **Cas edge** : si TOUS les bridges et tous les owners sont déconnectés, la place reste réservée pour toujours. Acceptable pour la démo.

### Step 4 — Commit

```bash
git add js/views/map.js
git commit -m "Sync reservations atomically via Supabase with race condition handling"
git push
```

- [ ] Exécuter ces commandes

---

## Task 7 : Déploiement Vercel

**Files :** Aucun fichier modifié (juste config sur le dashboard Vercel)

### Step 1 — Importer le projet dans Vercel

- [ ] Aller sur https://vercel.com/dashboard
- [ ] Cliquer "Add New..." → "Project"
- [ ] Dans la section "Import Git Repository", trouver ton repo `weepark`
- [ ] Cliquer "Import"

### Step 2 — Configurer le projet

- [ ] Project Name : `weepark` (ou ce qui te plaît — c'est ce qui apparaîtra dans l'URL)
- [ ] Framework Preset : **Other** (vanilla HTML/JS, pas de framework)
- [ ] Root Directory : `./` (par défaut)
- [ ] Build Command : laisser vide
- [ ] Output Directory : laisser vide (ou `./` si demandé)
- [ ] Install Command : laisser vide
- [ ] Cliquer "Deploy"

### Step 3 — Attendre le déploiement

- [ ] ~30 secondes plus tard, Vercel affiche "Your project has been deployed"
- [ ] Cliquer sur l'URL de déploiement (genre `weepark-xxxxxx.vercel.app`)
- [ ] Vérifier que le site charge et que la carte s'affiche
- [ ] Console (F12) : `Supabase connecté, 40 spots reçus` doit apparaître
- [ ] Badge "Cloud connecté" doit être bleu

### Step 4 — Choisir le domaine final

- [ ] Sur le dashboard du projet Vercel → onglet "Settings" → "Domains"
- [ ] Ajouter `weepark.vercel.app` (si dispo) ou `weepark-showroom.vercel.app` ou ce que tu veux
- [ ] Cette URL sera celle du QR code de la Task 8

### Step 5 — Test depuis un téléphone

- [ ] Sur ton tel : ouvre Chrome → tape l'URL Vercel
- [ ] Le site doit charger, la carte doit s'afficher
- [ ] **Test temps réel** : sur ton PC en local OU sur Supabase SQL Editor, change un statut → ton tel doit voir le marker changer
- [ ] Si OK, c'est gagné : la démo est techniquement prête

### Step 6 — Test multi-appareils (Niveau 3 du spec)

**Crucial de faire ce test au moins une fois avant le showroom !**

- [ ] Demande à 2-3 amis/colocs de scanner l'URL (ou un QR code provisoire de la Task 8) sur leur tel
- [ ] Toi sur ton PC, connecte la maquette
- [ ] Manipule un aimant → les 3 tels confirment le changement en <1s
- [ ] Un pote réserve une place → tous les autres voient l'orange
- [ ] Pas de plantage, pas de lag visible
- [ ] **Test 4G** : un pote coupe son WiFi, passe en 4G, refait le test → ça doit toujours marcher

### Step 7 — Pas de commit (config Vercel)

Vercel re-déploie automatiquement à chaque `git push`. Tu n'as rien à committer.

---

## Task 8 : QR code pour le poster

**Files :** Aucun fichier de code (juste une image à imprimer)

### Step 1 — Générer le QR code

- [ ] Aller sur https://qrserver.com/api/?size=600x600&data=https://TON-URL.vercel.app
- [ ] Remplacer `TON-URL` par l'URL de la Task 7 Step 4
- [ ] L'image qui s'affiche est ton QR code → clic droit → "Enregistrer l'image sous..."
- [ ] Sauvegarder en `weepark-qr.png` quelque part (Desktop par exemple)

### Step 2 — Tester le QR code

- [ ] Ouvrir l'image en grand sur ton écran
- [ ] Scanner avec ton tel (appareil photo natif ou app QR) → doit ouvrir le site WeePark
- [ ] Si ça marche pas, refaire avec une URL corrigée

### Step 3 — Ajouter au poster

- [ ] Soit envoyer le QR code à la personne qui finalise le poster
- [ ] Soit si le poster est déjà finalisé : imprimer le QR code en grand (10x10 cm min) sur une feuille à part, à coller sur ton stand
- [ ] **TOUJOURS** mettre l'URL en texte aussi, lisible à 2m, en cas de QR foireux

### Step 4 — Pas de commit (asset hors code)

Mais tu peux sauvegarder le QR code dans `docs/` du repo si tu veux :

```bash
git add docs/weepark-qr.png
git commit -m "Add QR code for showroom poster"
git push
```

- [ ] Optionnel mais propre

---

## Task 9 : Checklist finale pré-showroom (J-1)

**Files :** Aucun (validation finale)

### Step 1 — Suivre la checklist du spec Section 6

- [ ] Test end-to-end depuis 2 vrais téléphones différents (15 min)
- [ ] Désactiver veille PC (Paramètres → Système → Alimentation → Mise en veille = Jamais)
- [ ] Désactiver veille écran (idem mais "Mode écran")
- [ ] Charger PC à 100% + chargeur + multiprise dans le sac
- [ ] Tester les 6 capteurs un par un, 3x chacun
- [ ] QR code + URL imprimés en gros sur le poster
- [ ] Partage 4G testé depuis ton tel sur le PC
- [ ] "Carte de crash" préparée : que dire si tout pète

### Step 2 — Répétition générale chrono en main

- [ ] 3 répétitions complètes de 10 min minimum
- [ ] Démarrer PC depuis veille (simuler conditions réelles)
- [ ] Connecter capteur, vérifier badges verts (Capteur + Cloud)
- [ ] Faire scanner le QR par un proche
- [ ] Pitch 30s du problème + démo maquette + démo réservations multi-user + questions
- [ ] Si tu dépasses 10 min : couper des features, pas du polish

### Step 3 — Kit de survie dans le sac

- [ ] Multiprise
- [ ] Chargeur PC + power bank
- [ ] 2ème téléphone pour partage 4G d'urgence
- [ ] 5 aimants de spare
- [ ] Câble USB de spare
- [ ] Carte papier avec l'URL lisible à 2m

### Step 4 — Critère d'acceptation final

> **"Si je suis privé de connexion réseau pendant 1 minute en plein milieu de la démo, je peux le récupérer en moins de 10 secondes une fois le réseau revenu, sans rien expliquer au jury."**

- [ ] Vérifier que cette phrase est vraie en testant : couper le WiFi 1 min en plein test, le remettre → tout doit reprendre tout seul

---

## ⚠️ Écart conscient avec le spec

Le spec Section 6 mentionne un fallback "Supabase down → bouton qui désactive Supabase, code retombe en mode Web Serial → DOM direct". **Ce plan ne l'implémente pas**, pour ces raisons :

- Probabilité de panne Supabase pendant 4h de showroom : extrêmement faible (Supabase uptime > 99.9%)
- Coût d'implémentation : ~1 journée de dev (toggle UI, double code path, tests des 2 chemins)
- Bénéfice marginal : pour un cas qui n'arrivera quasi jamais

**Mitigation alternative déjà en place** : si Supabase tombe pendant la démo, le badge "Cloud connecté" devient gris (visible), et la story de repli devient "*regardez le système sur ce PC avec la maquette*" — démo dégradée à 1 device au lieu de N, mais reste démontrable.

Si après le showroom le projet continue, ce fallback peut être rajouté dans une itération ultérieure.

---

## ✅ Récap des deliverables

À la fin de l'exécution de ce plan, tu auras :

1. **Une table Supabase** `parking_spots` avec Realtime activé
2. **Un frontend modifié** qui :
   - Se connecte à Supabase au chargement
   - Réagit en temps réel aux UPDATE
   - Push les events capteur vers Supabase (quand connecté)
   - Centralise la simulation aléatoire dans le bridge
   - Gère les réservations atomiquement avec rebourse en cas de race
3. **Un déploiement Vercel** accessible par URL publique
4. **Un QR code** prêt à coller sur le poster
5. **Une checklist pré-showroom** validée

**Si tout est vert le jour J = la démo va cartonner.**
