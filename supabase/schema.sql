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
