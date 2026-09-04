# Riversmag — Plan des clusters SEO prioritaires

> Focus : Paris, Marrakech, Tokyo, Roma, Bali. Vague 1 (P0) implementée via le template réutilisable `HotelsHub` (route `/articles/hub/[type]/[city]`).

## 1. Grille de priorisation

Chaque page est notée sur 5 critères (1–5). Score = somme pondérée :

| Critère | Poids | Logique |
|---|---|---|
| Intention commerciale / affiliation | 25 % | Maison (HOTELS, transfers, ESIM, INSURANCE, activites) |
| Volume / intention de recherche | 25 % | "best hotels", "airport transfer" = forte demande |
| Position dans le cluster | 20 % | Pages hub → nourrissent le pillar, pas l'inverse |
| Faisabilité sans doublon | 20 % | Métier à donnees reeles (affiliateLinks, hotels, activities) |
| Potentiel long-tail | 10 % | Couples/families/luxury/budget |

**Tiers**
- **P0** = impératif : vente directe + volume mat + ville sous-servie.
- **P1** = priorité haute : complète le cluster, bon potentiel affil.
- **P2** = a faire plus tard : niche, faible affil.

## 2. État des lieux (ce qui EXISTE — ne pas recréer)

| Type | Paris | Marrakech | Tokyo | Rome | Bali |
|---|---|---|---|---|---|
| Pillar guidée | ✅ paris-travel-guide | ❌ | ✅ tokyo-travel-guide | ✅ rome-travel-guide | ✅ bali-travel-guide |
| Itinéraire | ✅ 4j | ❌ | ✅ 4j | ✅ 4j | ✅ 7j |
| Hotels | ❌ | ❌ | ❌ | ✅ best-hotels-in-rome | ✅ where-to-stay-in-bali |
| Things to do | ❌ | ❌ | ✅ best-things-to-do-in-tokyo | ✅ best-things-to-do-in-rome | ✅ best-things-to-do-in-bali |
| Day trips | ❌ | ❌ | ✅ mt-fuji-day-trip-from-tokyo | ✅ day-trips-from-rome | ❌ |
| Airport transfer | ❌ | ❌ | ❌ | ✅ rome-airport-transfer-guide | ❌ |
| Best time | ❌ | ❌ | (pays) | ❌ | ✅ best-time-to-visit-bali |
| Family | ❌ | ❌ | ❌ | ✅ rome-with-kids | ✅ bali-with-kids |
| Luxury | ❌ | ❌ | ❌ | ❌ | ✅ luxury-bali-resorts |
| Budget | ❌ | ❌ | ❌ | ❌ | ✅ bali-on-a-budget |
| Visa | ❌ | ❌ | ❌ | ❌ | ✅ bali-visa-guide |
| Transport | ❌ | ❌ | ❌ | ❌ | ✅ getting-around-bali |

**Conclusion : Paris et Marrakech sont sous-servis → priorité absolue.** Les eSIM `{ville}-esim` existent déjà (auto-générés) — ne pas recréer, les transformer en pages comparatives `best-esim-for-{ville}`.

## 3. Liste des pages recommandées

> Colonnes : V = Variante du template HotelsHub (`best-hotels` / `where-to-stay` / futur), A = type d'affil, URL = `/articles/hub/{type}/{city}` (ou `/articles/{slug}` pour les articles éditoriaux).

### Paris
| Priorité | URL / slug | Type | Affil | Note |
|---|---|---|---|---|
| P0 | `/articles/hub/best-hotels/paris` | Hub hotels | HOTELS | Grosse marge, inexistant |
| P0 | `/articles/hub/where-to-stay/paris` | Hub quartiers | HOTELS | Intention forte |
| P0 | `paris-airport-transfer-guide` | Utilitaire | AIRPORT_TRANSFERS | Transfer = marge |
| P0 | `best-things-to-do-in-paris` | Hub activites | ACTIVITIES | Volume massif |
| P1 | `paris-in-3-days-itinerary` | Itinéraire | — | Completer le 4j |
| P1 | `best-paris-tours` | Tours | ACTIVITIES | Skip-the-line |
| P1 | `best-esim-for-paris` | Comparatif eSIM | ESIM | Deduplique l'auto |
| P1 | `day-trips-from-paris` | Day trips | ACTIVITIES | Versailles/Giverny |
| P1 | `best-paris-food-guide` | Gastronomie | ACTIVITIES | Long-tail affil |
| P2 | `paris-in-7-days-itinerary` | Itinéraire | — | Long-tail |
| P2 | `paris-with-kids` | Famille | HOTELS | Pattern récurrent |
| P2 | `paris-luxury-hotels` | Hotels luxe | HOTELS | Niche haute valeur |
| P2 | `best-time-to-visit-paris` | Saison | — | Pillar |
| P2 | `paris-travel-cost` | Coût | — | Content-led |

### Marrakech
| Priorité | URL / slug | Type | Affil | Note |
|---|---|---|---|---|
| P0 | `marrakech-travel-guide` (PILLAR) | Pillar | — | Aucun pillar article |
| P0 | `/articles/hub/best-hotels/marrakech` | Hub hotels | HOTELS | Riads = affil |
| P0 | `/articles/hub/where-to-stay/marrakech` | Hub quartiers | HOTELS | Intention forte |
| P0 | `marrakech-airport-transfer-guide` (RAK) | Utilitaire | AIRPORT_TRANSFERS | Marge |
| P0 | `best-things-to-do-in-marrakech` | Hub activites | ACTIVITIES | Volume + affil |
| P1 | `marrakech-in-3-days-itinerary` | Itinéraire | — | L'article partiel |
| P1 | `best-marrakech-tours` / desert trips | Tours | ACTIVITIES | Desert = grosse affil |
| P1 | `best-esim-for-marrakech` | Comparatif eSIM | ESIM | Connectivité |
| P1 | `marrakech-food-guide` | Gastronomie | ACTIVITIES | Existe en activité à enrichir |
| P2 | `marrakech-in-5-days-itinerary` | Itinéraire | — | Long-tail |
| P2 | `marrakech-riads-guide` | Hotels | HOTELS | Niche distinctive |
| P2 | `best-time-to-visit-marrakech` | Saison | — | Pillar |

### Tokyo
| Priorité | URL / slug | Type | Affil | Note |
|---|---|---|---|---|
| P0 | `/articles/hub/best-hotels/tokyo` | Hub hotels | HOTELS | Manquant, volume énorme |
| P0 | `/articles/hub/where-to-stay/tokyo` | Hub quartiers | HOTELS | Shinjuku/Ginza etc. |
| P0 | `tokyo-airport-transfer-guide` (NRT/HND) | Utilitaire | AIRPORT_TRANSFERS | Marge |
| P1 | `tokyo-in-7-days-itinerary` | Itinéraire | — | Completer le 4j |
| P1 | `best-tokyo-food-guide` | Gastronomie | ACTIVITIES | Très commercial |
| P1 | `tokyo-day-trips` (Kamakura, Nikko) | Day trips | ACTIVITIES | Étend Mt-Fuji |
| P1 | `best-esim-for-tokyo` | Comparatif eSIM | ESIM | Connectivité |
| P2 | `tokyo-with-kids` | Famille | HOTELS | Pattern récurrent |
| P2 | `tokyo-luxury-hotels` | Hotels luxe | HOTELS | Niche |

### Rome
| Priorité | URL / slug | Type | Affil | Note |
|---|---|---|---|---|
| P1 | `rome-in-2-days-itinerary` | Itinéraire | — | Volumes 2j |
| P1 | `rome-in-3-days-itinerary` | Itinéraire | — | Volumes 3j |
| P1 | `/articles/hub/where-to-stay/rome` | Hub quartiers | HOTELS | Manque (best-hotels existe) |
| P1 | `best-rome-tours` (Colosseum/Vatican) | Tours | ACTIVITIES | Skip-the-line |
| P2 | `rome-food-guide` | Gastronomie | ACTIVITIES | Long-tail |
| P1 | `best-esim-for-rome` | Comparatif eSIM | ESIM | Deduplique auto |

### Bali
| Priorité | URL / slug | Type | Affil | Note |
|---|---|---|---|---|
| P0 | `bali-airport-transfer-guide` (DPS) | Utilitaire | AIRPORT_TRANSFERS | Marge, absent |
| P0 | `/articles/hub/best-hotels/bali` | Hub hotels | HOTELS | Absent (only where-to-stay existe) |
| P1 | `best-bali-tours` (Ubud/temples) | Tours | ACTIVITIES | GetYourGuide |
| P1 | `best-esim-for-bali` | Comparatif eSIM | ESIM | Connectivité |
| P2 | `bali-in-5-days-itinerary` | Itinéraire | — | Long-tail |
| P2 | `bali-food-guide` | Gastronomie | ACTIVITIES | Long-tail |
| P2 | `bali-car-rental` (scooter) | Transport | CAR_RENTAL | Affil spécifique |

### Pages transverses / hubs globaux (profilent toutes les villes)
| Priorité | Slug | Type | Affil | Note |
|---|---|---|---|---|
| P1 | `best-car-rental-companies` | Comparatif | CAR_RENTAL | Hub reutilisable en maillage |
| — | `best-esim-for-travel-guide` | EXISTE | — | Reutiliser, ne pas dupliquer |
| — | `best-travel-insurance-companies` | EXISTE | — | Reutiliser |

## 4. Ordre d'execution (vagues)

- **Vague 1 (P0, ~15 pages) — deja démarré** : hubs hotels (`best-hotels` / `where-to-stay`) via template reusable pour les 5 villes + pillar Marrakech + transfers + things-to-do Paris/Marrakech.
- **Vague 2 (P1)** : tours, food, esim comparatifs, itineraires 2–3j/7j.
- **Vague 3 (P2)** : family, luxury, budget, best-time, cost.

## 5. Regles anti-doublon

1. Ne **pas** recréer les eSIM `{ville}-esim` (existent). Creer `best-esim-for-{ville}` qui deduplique.
2. Ne pas dupliquer les evergreen : les **lier** depuis chaque cluster.
3. Pillar ≠ destination page : `/destinations/{city}` = hub SEO (structured data) ; `/articles/{city}-travel-guide` = hub **contenu editorial**. Mailler dans les deux sens, jamais de contenu identique.
4. Itineraire = entite `Itinerary` (avec `daysList`) + article ; pas de doublon texte.

## 6. Template reusable : etat

- `src/lib/hubs.ts` — config des types de hub (slug, titre, description). Ajouter un type = 1 entree.
- `src/components/hub/hotels-hub.tsx` — template `<HotelsHub>` : Hero, breadcrumbs JSON-LD, ISR `ItemList` + `Hotel` schema, CTA affil, grille hotels, liens internes.
- `src/app/articles/hub/[type]/[city]/page.tsx` — route dynamique (force-dynamic), SEO title/desc/canonical, 404 → notFound.
- URL live : `/articles/hub/best-hotels/paris`, `/articles/hub/where-to-stay/marrakech`, etc.
- **Vérifie** par `tsc --noEmit` + `eslint` + `next build` (OK). Donnees 100% reéels (hotels, affiliateLinks) — aucune donnée fictive.