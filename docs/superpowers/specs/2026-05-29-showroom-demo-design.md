# Design — WeePark Showroom Demo

**Date :** 2026-05-29
**Auteur :** Yohan
**Échéance :** Showroom Paris jeudi 04/06/2026, 13h-16h30
**Objectif :** Permettre à des visiteurs (jury + étudiants) de scanner un QR code sur le poster et voir, sur leur propre téléphone, la carte WeePark se mettre à jour en temps réel pendant qu'on manipule la maquette physique sur le stand.

---

## 1. Contexte

### Ce qui existe déjà

- Frontend WeePark : vanilla JS (Leaflet, Chart.js), aucun build step, fichiers statiques (`index.html` + dossiers `js/`, `css/`).
- Données mock : 40 places de parking codées en dur dans `js/data/parkings.js` (zones La Défense, Courbevoie, Puteaux, Neuilly).
- Lecture capteur : `js/components/sensor.js` utilise la **Web Serial API** pour lire un flux JSON `{id, statut}` de l'ESP32-C3 connecté en USB. La fonction `WeePark.Map.updateFromSensor(id, statut)` met à jour le marker correspondant.
- Simulation aléatoire : `js/views/map.js` flippe aléatoirement les statuts toutes les 5s pour donner vie à la carte (`simulateChanges`).
- Réservation locale : un bouton "Réserver" dans le popup d'une place libre, coût 5 crédits, timer 3 minutes, état stocké dans le navigateur uniquement.

### Le problème à résoudre

La Web Serial API n'existe pas sur navigateurs mobiles. Donc :

- Aujourd'hui, le téléphone d'un visiteur ne peut pas être directement connecté à la maquette.
- Pour une démo "réaliste" où le visiteur utilise son propre téléphone (comme un vrai conducteur), il faut un **pont entre la maquette et le téléphone via le cloud**.

### Les contraintes

- **Délai** : 6 jours calendaires entre aujourd'hui et le showroom (J-6).
- **Budget** : 0 €. Aucun achat de domaine, tier gratuit obligatoire partout.
- **Compétences** : développeur seul sur la partie software/cloud, les associés s'occupent du hardware (passer de 2 à 6 capteurs).
- **Maquette** : 6 capteurs à effet Hall (déclenchés par aimant) + 6 LEDs, sur ESP32-C3 SuperMini. Mappés aux IDs 1-6 de `parkings.js` (zone La Défense centre).
- **Fiabilité** : démo live devant jury. Tout échec visible = perte de points. La résilience prime sur la fonctionnalité avancée.

---

## 2. Décisions de cadrage

| Sujet | Décision | Justification |
|---|---|---|
| Backend realtime | **Supabase** (table SQL + Postgres Realtime) | Setup vanilla JS facile via CDN, tier gratuit ample, DB SQL gratuite en bonus, pas de carte bancaire requise. |
| Hébergement frontend | **Vercel** (`weepark.vercel.app`) | Déploiement automatique sur push GitHub, HTTPS inclus, sous-domaine gratuit suffisant pour la démo. |
| Architecture du pont | **Bridge dans le navigateur** | Chrome ouvert sur le PC du stand lit Web Serial ET push vers Supabase. Zéro install supplémentaire, un seul écran, moins de risques jour J qu'un script Node.js séparé. |
| Modèle de données | **Une table `parking_spots` (40 lignes), DB = source de vérité unique** | Cohérence garantie entre tous les clients, robuste aux reconnexions, permet historique futur. |
| Simulation des places non-physiques | **ON pour IDs 7-40, OFF pour IDs 1-6, exécutée uniquement par le bridge** | Carte "vivante" partout sans désynchroniser les visiteurs entre eux. Storytelling : zone pilote équipée + projection du déploiement. |
| Réservations | **Synchronisées en temps réel via Supabase** (multi-user) | Effet "wahou" devant jury, premier-arrivé-premier-servi atomique via `UPDATE ... WHERE statut='libre'`. |
| Crédits utilisateur | **Restent locaux à chaque navigateur** (`localStorage`) | Chaque visiteur arrive avec 50 crédits, simple, suffisant pour la démo. |
| Mode démo | **QR code sur poster** → visiteurs sur leurs propres téléphones | Le plus immersif et le plus représentatif du produit final. |

---

## 3. Architecture

### Vue d'ensemble

```
┌──────────────────┐      ┌──────────────┐     ┌────────────────┐
│ MAQUETTE ESP32   │ USB  │   PC STAND   │     │   SUPABASE     │
│ 6 capteurs Hall  │═════►│  Chrome sur  │────►│  Table         │
│ 6 LEDs           │      │  Vercel +    │ HTTP│  parking_spots │
│ Aimants → ON/OFF │      │  Bridge JS   │     │  + Realtime    │
└──────────────────┘      └──────────────┘     └────────┬───────┘
                                                        │
                                  WebSocket temps réel  │
                                                        ▼
                                  ┌─────────────────────────────────┐
                                  │   N TÉLÉPHONES VISITEURS        │
                                  │   (Chrome/Safari, WiFi/4G)      │
                                  └─────────────────────────────────┘
```

### Rôles du système

| Rôle | Qui le joue | Responsabilité |
|---|---|---|
| **Producteur d'événements physiques** | ESP32 | Émet `{"id":N,"statut":"..."}` JSON sur Serial à chaque changement de capteur |
| **Bridge** | Chrome sur le PC du stand | (1) Lit Web Serial, (2) Push vers Supabase, (3) Simule les places non-physiques, (4) Cleanup des réservations expirées |
| **Consommateurs** | Tous les navigateurs (bridge inclus) | S'abonnent au Realtime channel, mettent à jour la carte localement à chaque event |

Le PC du stand joue à la fois le rôle de bridge et de consommateur. Les téléphones des visiteurs sont uniquement consommateurs.

### Fichiers du projet (nouveaux et modifiés)

| Fichier | Type | Rôle |
|---|---|---|
| `js/lib/supabase.js` | Nouveau | Init du client Supabase (URL + clé `anon` publique) |
| `js/components/sensor.js` | Modifié | Après chaque event capteur → UPDATE Supabase (au lieu d'updater le DOM direct) |
| `js/components/realtime.js` | Nouveau | Init du WebSocket, SELECT initial, abonnement au channel, dispatch vers `updateFromSensor` |
| `js/components/bridge.js` | Nouveau | Détecte si Web Serial est connecté ; si oui, exécute la simulation aléatoire des places 7-40 et le cleanup des réservations expirées |
| `js/views/map.js` | Modifié | (1) Retirer le `setInterval(simulateChanges, 5000)` global (la simulation passe dans le bridge) ; (2) `reserve()` push vers Supabase au lieu de modifier l'état local direct |
| `index.html` | Modifié | Ajout du script Supabase via CDN + des 3 nouveaux fichiers JS, ajout d'un badge "Cloud connecté" |
| `supabase/schema.sql` | Nouveau | Script SQL : création de la table, contraintes, RLS, seed initial |

**Aucun build step, aucun framework ajouté.** Reste du vanilla JS pur, chargé via `<script>` dans `index.html`.

---

## 4. Modèle de données Supabase

### Table

```sql
CREATE TABLE parking_spots (
  id              integer PRIMARY KEY,
  statut          text NOT NULL CHECK (statut IN ('libre', 'occupee', 'reservee')),
  reserved_until  timestamptz,
  updated_at      timestamptz NOT NULL DEFAULT now()
);
```

| Colonne | Rôle |
|---|---|
| `id` | 1-40, mappé sur les IDs de `parkings.js`. Les métadonnées statiques (lat, lng, rue, taille, prix, zone) restent en dur côté frontend. |
| `statut` | Seule donnée qui change dans le temps. Contrainte `CHECK` pour interdire les valeurs invalides. |
| `reserved_until` | Heure d'expiration quand `statut='reservee'`. Permet countdown local + cleanup automatique. |
| `updated_at` | Pour debug, monitoring, et historique éventuel. |

### Row Level Security (RLS)

```sql
ALTER TABLE parking_spots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anyone can read" ON parking_spots
  FOR SELECT TO anon USING (true);

CREATE POLICY "anyone can update" ON parking_spots
  FOR UPDATE TO anon USING (true) WITH CHECK (true);
```

**Compromis assumé** : la clé `anon` est exposée dans le HTML (inévitable pour du frontend pur). Avec les policies ci-dessus, un visiteur malveillant pourrait spammer des UPDATE. Risque acceptable pour 1 jour de showroom devant un jury et des étudiants. À durcir si le projet continue après (edge function avec secret).

### Seed initial

```sql
INSERT INTO parking_spots (id, statut) VALUES
  (1, 'libre'), (2, 'occupee'), (3, 'libre'), (4, 'libre'),
  (5, 'occupee'), (6, 'reservee'), (7, 'occupee'), (8, 'libre'),
  -- ... 40 lignes au total, copiées depuis parkings.js
  (40, 'libre');
```

### Activation Realtime

Dans le dashboard Supabase : Database → Replication → activer la table `parking_spots` pour les events `UPDATE`.

---

## 5. Data flows

### Flow 1 — Ouverture du site par un visiteur

1. Visiteur scanne le QR code → Vercel sert le HTML/JS/CSS.
2. Le frontend initialise le client Supabase.
3. `SELECT * FROM parking_spots` pour récupérer l'état actuel (40 lignes).
4. Affichage de la carte avec les statuts réels.
5. Ouverture du WebSocket Realtime, abonnement au channel `parking_spots`.
6. À partir de là, chaque UPDATE en DB est reçu en quasi temps réel.

### Flow 2 — Aimant placé/retiré sur la maquette

1. Capteur Hall change d'état → ESP32 écrit `{"id":3,"statut":"occupee"}\n` sur Serial.
2. Bridge (Chrome sur PC) parse le JSON dans `readLoop()`.
3. `UPDATE parking_spots SET statut='occupee', updated_at=now() WHERE id=3`.
4. Postgres CDC capture l'UPDATE → broadcast Realtime à tous les WebSockets ouverts.
5. Tous les clients (PC + téléphones visiteurs) reçoivent l'event et appellent `updateFromSensor(3, 'occupee')`.
6. Marker passe en rouge partout en <300ms.

### Flow 3 — Simulation aléatoire (places 7-40)

Seul le bridge (Chrome avec Web Serial connecté) exécute toutes les 5s :

```javascript
const nonPhysical = parkings.filter(p => p.id > 6 && p.statut !== 'reservee');
const target = nonPhysical[Math.floor(Math.random() * nonPhysical.length)];
const newStatut = target.statut === 'libre' ? 'occupee' : 'libre';
supabase.from('parking_spots').update({statut: newStatut}).eq('id', target.id);
```

L'UPDATE propage via Realtime à tous les clients. **Aucun client ne simule localement** → cohérence parfaite entre tous les visiteurs.

### Flow 4 — Visiteur réserve une place

1. Visiteur clique "Réserver place #4" sur son téléphone.
2. Vérification crédits locaux (≥5) → si OK, déduction locale.
3. UPDATE atomique :
   ```sql
   UPDATE parking_spots
   SET statut='reservee', reserved_until=now() + interval '3 minutes'
   WHERE id=4 AND statut='libre';
   ```
4. **Si 1 ligne affectée** : succès, Realtime propage → tous les clients voient la place en orange.
5. **Si 0 ligne affectée** : un autre visiteur l'a réservée 0.1s avant → toast "déjà réservée", remboursement local des crédits.

L'`AND statut='libre'` garantit l'atomicité : PostgreSQL exécute séquentiellement, premier arrivé premier servi.

### Flow 5 — Expiration d'une réservation

Le bridge fait un cleanup toutes les 10s :

```javascript
supabase.from('parking_spots')
  .update({ statut: 'libre', reserved_until: null })
  .eq('statut', 'reservee')
  .lt('reserved_until', new Date().toISOString());
```

Le countdown visuel sur le téléphone du visiteur qui a réservé est calculé localement à partir de `reserved_until - now()` → pas de polling.

### Flow 6 — Déconnexion/reconnexion réseau d'un visiteur

1. WiFi du téléphone coupe → `supabase-js` détecte la coupure.
2. Carte garde son dernier état affiché (pas de plantage).
3. WiFi revient → `supabase-js` reconnecte le WebSocket automatiquement.
4. Notre code détecte la reconnexion → relance un `SELECT *` pour resync l'état.
5. La carte se met à jour avec l'état actuel, plus aucun retard visible.

---

## 6. Gestion d'erreurs et fallbacks

### Matrice des modes de défaillance

| Mode | Probabilité | Impact | Détection | Mitigation |
|---|---|---|---|---|
| Câble USB se débranche | Faible | Bridge ne lit plus capteurs (cloud continue) | Web Serial `NetworkError` | Badge "Capteur" devient rouge, re-clic pour reconnecter |
| ESP32 plante / reboot | Moyenne | Idem | Idem | Rebrancher, reset board, ~3s pour reprendre |
| WiFi PC tombe | Faible | Critique : bridge ne peut plus écrire | `fetch` timeout, `CHANNEL_ERROR` | **Partage 4G depuis ton tel** vers PC, ~30s de bascule |
| WiFi téléphone visiteur tombe | Moyenne | Carte figée chez ce visiteur | supabase-js reconnect auto | Reconnexion auto + resync SELECT (déjà prévu) |
| Supabase down | Très faible | Démo cloud morte | `503`/`429` | Fallback "mode local" : bouton qui désactive Supabase, code retombe en mode Web Serial → DOM direct |
| Vercel down | Très très faible | Site inaccessible | QR code → page erreur | Ouvrir le site en local sur ton PC, démo dégradée |
| Onglet bridge fermé | Moyenne (stress) | Simulation + pont arrêtés | Rien ne bouge | Rouvrir onglet, re-cliquer bouton capteur (~10s) |
| PC en veille | Moyenne | Tout s'arrête | Visible | **Désactiver veille avant showroom** (Paramètres → Alimentation) |
| Visiteur ne scanne pas QR | Moyenne | Frustration visiteur | Visible | URL `weepark.vercel.app` en gros texte sous le QR |
| Aimant trop faible | Moyenne | Capteur ne déclenche pas | Test pré-showroom | Aimants de spare + test 5x par place la veille |

### Principes de design pour la robustesse

1. **Fail gracefully, jamais silencieusement** : 2 badges visuels ("Capteur en direct", "Cloud connecté"). Tout dégradé devient visible immédiatement.
2. **Idempotence des UPDATE** : envoyer 2x `statut='occupee'` ne provoque pas de divergence.
3. **`try/catch` systématique** : aucun `await` non protégé, aucun chemin "happy path only".

### Kit de survie à apporter le jour J

- Multiprise (prises rares au showroom)
- Chargeur PC + power bank
- 2ème téléphone pour partage 4G d'urgence
- 5 aimants de spare
- Câble USB de spare
- Carte papier avec l'URL `weepark.vercel.app` lisible à 2m

### Checklist pré-showroom (J-1)

- [ ] Test end-to-end depuis 2 vrais téléphones différents (15 min)
- [ ] Désactiver veille PC + écran
- [ ] Charger PC à 100% + chargeur + multiprise prêts
- [ ] Tester les 6 capteurs un par un, 3x chacun
- [ ] QR code + URL imprimés en gros sur le poster
- [ ] Partage 4G testé depuis le tel sur le PC
- [ ] "Carte de crash" préparée : pitch dégradé si tout pète

---

## 7. Stratégie de tests

### Niveau 1 — Tests par étape pendant le dev

Validation manuelle structurée à chaque étape. Pas de framework de test (overkill pour 1 semaine vanilla JS).

**Étape A — Init Supabase**
- Table créée avec 40 lignes
- Contrainte CHECK refuse `statut='nawak'`
- Realtime activé sur la table

**Étape B — Lecture seule frontend**
- Chargement : "Supabase connecté, 40 spots reçus" en console
- Carte affichée avec couleurs correspondant aux statuts DB
- Modif manuelle d'un statut dans SQL Editor → marker change en <2s
- Couper/remettre WiFi → reconnexion + resync

**Étape C — Bridge Web Serial → Supabase**
- Connexion capteur OK, badge vert
- Aimant place #1 → DB met à jour
- Propagation Realtime : modification visible dans un 2ème onglet

**Étape D — Simulation centralisée**
- Sans capteur connecté : aucun marker bouge
- Avec capteur : IDs 7-40 bougent dans tous les onglets
- IDs 1-6 ne changent que par aimant

**Étape E — Réservations multi-utilisateurs**
- Réservation propage à tous les onglets
- Race condition : 1 seul réussit
- Expiration auto après 3 min
- Crédits débités/remboursés correctement

### Niveau 2 — Test d'intégration maquette complète

Une session dédiée maquette + cloud, idéalement à J-2 :
- Tester les 6 capteurs un par un (mettre/enlever aimant 3x, vérifier en DB et sur tel)
- Multi-events : 3 aimants simultanés
- Stabilité 30 min sans intervention (pas de leak RAM)

### Niveau 3 — Test multi-appareils (simulation showroom)

**LE test qui compte.** À J-2 minimum :
- 3-4 personnes scannent le QR code avec leur tel
- Manipulation des aimants → ils confirment voir les changements
- Quelqu'un réserve → tous voient le changement
- Latence acceptable, pas de tel qui rame
- Tester avec un tel en 4G (pas WiFi maison)

### Niveau 4 — Test de charge (optionnel)

- Ouvrir 10 onglets Chrome sur le site
- Manipuler la maquette, vérifier qu'aucun onglet ne lag
- Dashboard Supabase confirme 10+ connexions Realtime

### Niveau 5 — Répétition générale J-1

3 répétitions complètes de la présentation de 10 min, chrono en main :
- Démarrer PC depuis veille
- Connecter capteur, vérifier les 2 badges verts
- Faire scanner le QR par un proche
- Présenter comme si jury :
  - Pitch 30s du problème
  - Démo maquette + carte temps réel
  - Démo réservations multi-utilisateurs
  - Réponses aux questions probables

### Critère d'acceptation final

> "Si je suis privé de connexion réseau pendant 1 minute en plein milieu de la démo, je peux le récupérer en moins de 10 secondes une fois le réseau revenu, sans rien expliquer au jury."

Si tu ne peux pas affirmer ça, on retravaille la résilience avant le jour J.

---

## 8. Hors scope pour cette spec

Ces éléments ne sont **pas** traités ici et restent en l'état actuel :

- Le système de **crédits** (gain par pub, conversion en €) reste local et inchangé.
- La vue **Stats**, **Louer**, **Crédits**, **Dashboard Gestionnaire** restent en lecture seule sur les données mockées existantes (pas de Supabase pour elles).
- Le **guidage vocal** et la **géolocalisation** restent fonctionnels comme aujourd'hui, sans modification.
- La **publication d'annonce de location** reste locale.
- La **firmware ESP32** n'est pas modifiée par cette spec (les associés s'occupent du passage de 2 à 6 capteurs en gardant le même format JSON).
- L'**adresse Vercel** sera `weepark.vercel.app` (ou variante si pris) — pas de nom de domaine custom.

Si après le showroom le projet continue, ces éléments rejoindront le scope d'une spec ultérieure.

---

## 9. Prochaines étapes

1. **Création des comptes** (Yohan) : GitHub (perso), Supabase (perso), Vercel (perso).
2. **Push du repo sur GitHub** (Yohan) : créer le repo, `git remote add origin`, `git push`.
3. **Écriture du plan d'implémentation détaillé** (étape suivante avec skill `writing-plans`).
4. **Exécution du plan** par étapes vérifiables.
5. **Tests** selon Section 7.
6. **Showroom** jeudi 04/06.
