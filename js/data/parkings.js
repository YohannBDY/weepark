/* ============================================================
   Données mock — 40 places à La Défense / Puteaux / Courbevoie / Neuilly
   ============================================================ */

window.WeePark = window.WeePark || {};

WeePark.parkings = [
  /* ── La Défense Centre ──────────────────────────────────── */
  { id:  1, lat: 48.8921, lng: 2.2384, rue: "Esplanade de la Défense",          zone: "Défense",    taille: "moyenne", prix: 5, statut: "libre"    },
  { id:  2, lat: 48.8935, lng: 2.2358, rue: "Allée de l'Arche",                 zone: "Défense",    taille: "petite",  prix: 4, statut: "occupee"  },
  { id:  3, lat: 48.8906, lng: 2.2410, rue: "Place de Valmy",                   zone: "Défense",    taille: "grande",  prix: 6, statut: "libre"    },
  { id:  4, lat: 48.8948, lng: 2.2376, rue: "Parvis de la Grande Arche",        zone: "Défense",    taille: "moyenne", prix: 5, statut: "libre"    },
  { id:  5, lat: 48.8896, lng: 2.2430, rue: "Boulevard Circulaire Nord",        zone: "Défense",    taille: "suv",     prix: 8, statut: "occupee"  },
  { id:  6, lat: 48.8916, lng: 2.2400, rue: "Les Quatre Temps",                 zone: "Défense",    taille: "grande",  prix: 6, statut: "reservee" },
  { id:  7, lat: 48.8928, lng: 2.2365, rue: "Tour First — Parking",             zone: "Défense",    taille: "suv",     prix: 8, statut: "occupee"  },
  { id:  8, lat: 48.8911, lng: 2.2388, rue: "CNIT La Défense",                  zone: "Défense",    taille: "moyenne", prix: 5, statut: "libre"    },

  /* ── Courbevoie ─────────────────────────────────────────── */
  { id:  9, lat: 48.8960, lng: 2.2395, rue: "Rue du 8 Mai 1945",                zone: "Courbevoie", taille: "petite",  prix: 4, statut: "reservee" },
  { id: 10, lat: 48.8957, lng: 2.2440, rue: "Rue Gabriel Péri",                 zone: "Courbevoie", taille: "suv",     prix: 8, statut: "occupee"  },
  { id: 11, lat: 48.8975, lng: 2.2360, rue: "Boulevard de la Mission Marchand", zone: "Courbevoie", taille: "grande",  prix: 6, statut: "libre"    },
  { id: 12, lat: 48.8942, lng: 2.2462, rue: "Rue du Château",                   zone: "Courbevoie", taille: "grande",  prix: 6, statut: "libre"    },
  { id: 13, lat: 48.8985, lng: 2.2410, rue: "Rue Saint-Denis",                  zone: "Courbevoie", taille: "petite",  prix: 4, statut: "occupee"  },
  { id: 14, lat: 48.8945, lng: 2.2440, rue: "Rue des Bourguignons",             zone: "Courbevoie", taille: "suv",     prix: 8, statut: "libre"    },
  { id: 15, lat: 48.8975, lng: 2.2450, rue: "Boulevard de Verdun",              zone: "Courbevoie", taille: "grande",  prix: 6, statut: "occupee"  },
  { id: 16, lat: 48.8962, lng: 2.2355, rue: "Rue du Dr Zamenhof",               zone: "Courbevoie", taille: "petite",  prix: 4, statut: "libre"    },
  { id: 17, lat: 48.8990, lng: 2.2370, rue: "Avenue de Stalingrad",             zone: "Courbevoie", taille: "moyenne", prix: 5, statut: "occupee"  },
  { id: 18, lat: 48.8960, lng: 2.2480, rue: "Rue des Fossés",                   zone: "Courbevoie", taille: "moyenne", prix: 5, statut: "libre"    },
  { id: 19, lat: 48.8925, lng: 2.2420, rue: "Rue du Capitaine Guynemer",        zone: "Courbevoie", taille: "petite",  prix: 4, statut: "occupee"  },

  /* ── Puteaux ────────────────────────────────────────────── */
  { id: 20, lat: 48.8912, lng: 2.2336, rue: "Rue de Villiers",                  zone: "Puteaux",    taille: "moyenne", prix: 5, statut: "libre"    },
  { id: 21, lat: 48.8868, lng: 2.2390, rue: "Rue du Président Wilson",          zone: "Puteaux",    taille: "grande",  prix: 6, statut: "libre"    },
  { id: 22, lat: 48.8888, lng: 2.2490, rue: "Rue Anatole France",               zone: "Puteaux",    taille: "petite",  prix: 4, statut: "occupee"  },
  { id: 23, lat: 48.8930, lng: 2.2312, rue: "Rue Volta",                        zone: "Puteaux",    taille: "moyenne", prix: 5, statut: "libre"    },
  { id: 24, lat: 48.8858, lng: 2.2420, rue: "Rue du Port",                      zone: "Puteaux",    taille: "suv",     prix: 8, statut: "occupee"  },
  { id: 25, lat: 48.8900, lng: 2.2350, rue: "Avenue de la République",          zone: "Puteaux",    taille: "moyenne", prix: 5, statut: "libre"    },
  { id: 26, lat: 48.8870, lng: 2.2320, rue: "Rue Cartault",                     zone: "Puteaux",    taille: "grande",  prix: 6, statut: "reservee" },
  { id: 27, lat: 48.8950, lng: 2.2320, rue: "Rue Louis Blanc",                  zone: "Puteaux",    taille: "moyenne", prix: 5, statut: "libre"    },
  { id: 28, lat: 48.8840, lng: 2.2370, rue: "Rue Jean Jaurès",                  zone: "Puteaux",    taille: "petite",  prix: 4, statut: "occupee"  },
  { id: 29, lat: 48.8918, lng: 2.2295, rue: "Avenue du Général Leclerc",        zone: "Puteaux",    taille: "grande",  prix: 6, statut: "libre"    },
  { id: 30, lat: 48.8830, lng: 2.2410, rue: "Rue de la Paix",                   zone: "Puteaux",    taille: "petite",  prix: 4, statut: "libre"    },
  { id: 31, lat: 48.8910, lng: 2.2260, rue: "Rue de Puteaux",                   zone: "Puteaux",    taille: "suv",     prix: 8, statut: "occupee"  },
  { id: 32, lat: 48.8878, lng: 2.2340, rue: "Rue du Bois",                      zone: "Puteaux",    taille: "grande",  prix: 6, statut: "libre"    },
  { id: 33, lat: 48.8892, lng: 2.2290, rue: "Rue Roque de Fillol",              zone: "Puteaux",    taille: "petite",  prix: 4, statut: "libre"    },
  { id: 34, lat: 48.8848, lng: 2.2260, rue: "Avenue Jean-Baptiste Clément",     zone: "Puteaux",    taille: "moyenne", prix: 5, statut: "occupee"  },

  /* ── Neuilly-sur-Seine ──────────────────────────────────── */
  { id: 35, lat: 48.8882, lng: 2.2458, rue: "Avenue de Neuilly",                zone: "Neuilly",    taille: "petite",  prix: 4, statut: "occupee"  },
  { id: 36, lat: 48.8908, lng: 2.2475, rue: "Avenue de la Grande Armée",        zone: "Neuilly",    taille: "suv",     prix: 8, statut: "libre"    },
  { id: 37, lat: 48.8878, lng: 2.2510, rue: "Boulevard du Général de Gaulle",   zone: "Neuilly",    taille: "grande",  prix: 6, statut: "occupee"  },
  { id: 38, lat: 48.8935, lng: 2.2490, rue: "Rue de Chartres",                  zone: "Neuilly",    taille: "moyenne", prix: 5, statut: "libre"    },
  { id: 39, lat: 48.8892, lng: 2.2530, rue: "Avenue du Roule",                  zone: "Neuilly",    taille: "petite",  prix: 4, statut: "occupee"  },
  { id: 40, lat: 48.8930, lng: 2.2540, rue: "Boulevard Victor Hugo",            zone: "Neuilly",    taille: "suv",     prix: 8, statut: "libre"    },
];
