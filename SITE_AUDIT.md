# SITE_AUDIT.md — Riversmag

**Date :** 2026-10-18
**Branche :** `feature/content-upgrade`
**Base :** `main` @ `6ad4bce`
**Méthode :** crawl HTTP de production + lecture du dépôt. Aucun fichier source n'a été modifié.
**Contenu des chiffres :** mesures relevées, pas estimées. Voir « Méthode » en fin de document.

---

## 1. Cadre technique

| Élément | Valeur |
|---|---|
| Framework | Next.js **16.3.8** (App Router), React 19.2.8 |
| Build | `next build --webpack` |
| Langage | TypeScript 5 — `tsc --noEmit` exit 0 |
| Style | Tailwind v4, PostCSS `@tailwindcss/postcss` 4.3.3 |
| Data source | **Prisma + Neon (PostgreSQL)** — aucun MDX, aucun `.md` |
| Contenu stocké | `Article.content` = `ContentBlock[]` sérialisé en JSON (`src/lib/content.ts`) |
| Routing | `/articles/[slug]`, `/destinations/[...path]`, `/articles/hub/[type]/[city]`, `/itineraries/[slug]`, `/hotels/[slug]`, `/activities/[slug]`, `/out/[id]` |
| Admin | `/admin` — 16 panneaux (articles, destinations, médias, auteurs, liens affiliés, eSIM, settings…) |
| Hébergement | Hostinger, branche `main`, Node 22.x, build `npm run build`, sortie `.next` |

### Variables d'environnement (`src/` + `prisma/`)

```
DATABASE_URL          AUTH_SECRET           ADMIN_EMAILS
NEXT_PUBLIC_SITE_URL  NEXT_PUBLIC_SITE_NAME NEXT_PUBLIC_SITE_TAGLINE
NEXT_PUBLIC_GA_MEASUREMENT_ID               UNSPLASH_ACCESS_KEY
FOURTHWALL_TOKEN      FOURTHWALL_SHOP_DOMAIN   (absents — boutique désactivée)
```

---

## 2. Contenu source (dossier fourni)

`C:\Users\pc\Desktop\ProJ\BLOGGING + PRINT ON DEMAND\Traval Bloggs`

```
117 fichiers · 181,33 Mo · 105 images · 11 DOCX · 1 HTML
```

### 2.1 Textes — 11 DOCX

Mots et headings relevés par extraction `word/document.xml`.

| ID | Article | Mots | Headings | Verdict |
|---|---|---|---|---|
| doc01 | albania-tirana-albanian-riviera | 1 262 | 6 | ✅ publiable |
| doc02 | azores-hidden-islands-nature-lovers | 1 284 | 8 | ✅ publiable |
| doc03 | georgia-tbilisi-caucasus | 1 282 | 7 | ✅ publiable |
| doc04 | Best Summer Holiday | 1 293 | **0** (markdown inline) | ⚠️ exploitable — structure `#`/`##` à parser |
| doc05 | Caribbean Travel Guide | **456** | 0 | ❌ thin < 600 |
| doc06 | Florida Travel Guide | **417** | 0 | ❌ thin |
| doc07 | Greece Travel Guide | **514** | 0 | ❌ thin |
| doc08 | Italy Travel Guide | **456** | 0 | ❌ thin |
| doc09 | Mexico Travel Guide | **432** | 0 | ❌ thin |
| doc10 | Portugal Travel Guide | **410** | 0 | ❌ thin |
| doc11 | Spain Travel Guide | **452** | 0 | ❌ thin |

**4 exploitables, 7 thin (410–516 mots).** Les 7 vont dans `NEEDS_MY_INPUT.md`.

**doc01–doc03 sont structurés** : `Heading1` (titre), `Heading2` (sections), `ListNumber` (itinéraire), `ListBullet` (notes pratiques), `Quote`.

**Structure markdown inline de doc04** : `# ` titre, `## N. Pays`, `### What to Wear`, `**Label:**` en gras, `- ` listes.

### 2.2 Images — 105 fichiers

| Format | Quantité |
|---|---|
| .jpeg | 55 |
| .jpg | 44 |
| .webp | 4 |
| .png | 1 |
| .avif | 1 |

- **47 fichiers > 2 Mo**, max **3 986 Ko** → conversion WebP/AVIF 1600px nécessaire
- **Doublon exact** : `photos/Traveler_standing_in_Park_Guell_202608192017.jpeg` + `... (1).jpeg` — 2 792,6 Ko × 2, identiques
- **Noms non descriptifs** : `DSC_9751.jpg`, `taormina a.jpg`, `Ibiza Spain a.jpg`, `Italy - Positano, Amalfi Coast.jpg`
- **48 fichiers nommés `Person_*_20260819…`** — nom + timestamp, aucun lieu
- **Dossiers** : `BLOGG ARTICLES/` (8 guides + photos), `COVER PCTS/` (16), `photos/` (31)

### 2.3 ⚠️ Droits d'auteur — bloquant

doc01, doc02, doc03 portent chacun cette note de l'auteur :

> **Image sources:** … **Confirm reuse or licensing terms with the original source before commercial publication.**

| Article | Sources déclarées |
|---|---|
| doc01 Albanie | Nomads Travel Guide · Adventure Albania · Albanian Registry |
| doc02 Açores | Azores Getaways (×2) · Espaço Talassa |
| doc03 Géorgie | Lonely Planet · Explore Georgia Tours · Georgian Eats |

**Aucune image tierce n'est publiée.** Cas `NEEDS_MY_INPUT.md`.

`COVER PCTS/` et `photos/` : noms à timestamp (`_202608182003`), propriété invérifiable → `NEEDS_MY_INPUT.md`.
`photos/` contient des personnes identifiables → droit à l'image à confirmer.

`*shutterstock.jpg` et `Mykonos-Area-Guide-Hero-min.jpg` → stock, droits à confirmer.

---

## 3. Routes

### 3.1 Statut relevé (production)

**36 routes testées : 36 × HTTP 200**, sauf :

| Route | Statut | Cause |
|---|---|---|
| `/shop` | **404** | `isShopEnabled()` → `FOURTHWALL_TOKEN` absent (`src/lib/fourthwall.ts`) |
| `/printables` | **404** | `src/app/printables/page.tsx` **n'existe pas** |
| `/printables/poster` | **404** | idem — seuls `[slug]` existent |
| `/not-found-test-xyz` | 404 | attendu — page 404 personnalisée active |

### 3.2 Liens morts : 22 hubs 404

**40 combinaisons testées (4 types × 10 destinations) : 18 × 200, 22 × 404.**

| Type | Destinations 404 |
|---|---|
| `best-hotels` | bali, japan, morocco, italy, france, portugal (6) |
| `where-to-stay` | bali, japan, morocco, italy, france, portugal (6) |
| `best-tours` | japan, morocco, italy, france, portugal (5) |
| `things-to-do` | japan, morocco, italy, france, portugal (5) |

**Cause racine identifiée :**

- `src/components/destination/destination-detail.tsx:149` — rend les 4 liens **inconditionnellement**
- `src/app/articles/hub/[type]/[city]/page.tsx:87` — `if (activities.length === 0) notFound()`
- `src/app/articles/hub/[type]/[city]/page.tsx:137` — `if (hotels.length === 0) notFound()`

Le hub sert volontairement 404 sans inventaire (« thin content, never indexed »), mais la page destination ne l'applique jamais. **Le sitemap, lui, filtrait correctement** (`sitemap.ts:64-79`) : sitemap et liens rendus divergeaient.

→ **FIXÉ** : `src/lib/hubs.ts` expose `HUB_TYPES_BY_DATA` / `availableHubTypes()` ; les deux call sites l'utilisent.

### 3.3 `/shop` et `/printables` — liens

Mesure : **0 lien** vers `/shop` ou `/printables` depuis home, `/articles`, `/destinations`, `/guides`, `/free-guides`, `/resources`, `/travel-tips`, `/travel-gear`, `/deals`, `/about`.

**Aucun lien cassé en conséquence.** `/shop` absent du sitemap (conditional `isShopEnabled()`). `/printables/` bloqué dans `robots.txt`.

---

## 4. Liens internes & orphan

| Contrôle | Résultat |
|---|---|
| Liens internes absolus sur la home | 53 |
| Destinations testées : ancres `#…` mortes | **0** sur 10 |
| Sections Hotels/Activities/Itineraries/eSIM | **présentes sur les 10** destinations |
| Articles sitemap (hors hub) | 63 |
| Articles orphelins (non liés depuis home/articles/destinations/guides/free-guides/travel-tips/resources) | **0 sur 63** |
| Articles liés depuis les 5 destinations principales | 50 |

**Bon état :** `destination-detail.tsx` conditionne déjà les sections (`length > 0` aux lignes 191, 224, 253, 275) — aucun bloc vide, aucune ancre morte côté sections. `infoSections` est filtré `.filter((s) => s.content)` (ligne 174).

---

## 5. Contenu dupliqué / empty states

| Contrôle | Résultat |
|---|---|
| `lorem` / `undefined` / `NaN` / `null` / `placeholder` **dans le texte visible** | **0** |
| Faux positifs initiaux | payload JSON RSC (`"$undefined"`) — pas rendu |
| Guides eSIM ville : titles dupliqués | **0** |
| Guides eSIM ville : descriptions dupliquées | **0** — 6 vérifiées (New York, Barcelona, Lisbon, Athens, Miami, Los Angeles) |

Exemple vérifié :

```
new-york-esim   T: eSIM in New York: Indoor Signal, Data Needs and Fixes
                D: Why New York connectivity degrades indoors, how much data…
barcelona-esim  T: eSIM in Barcelona: Data Needs, Walking the City and Setup
                D: How much data a Barcelona week needs…
lisbon-esim     T: eSIM in Lisbon: Hills, Signal Gaps and Offline Maps
                D: Why Lisbon's hills cost you signal…
```

**Ces guides ne nécessitent ni consolidation ni noindex.**

⚠️ Seul faux positif à retenir : `destination-detail.tsx:140` — fallback Overview textuel **identique** sur toute destination sans `overview` :

> « Explore {name} with Riversmag's in-depth destination guide — from the best areas to stay… »

Répété sur les destinations sans overview. → Phase 3.

---

## 6. SEO sémantique

Échantillon **20 pages** :

| Contrôle | Résultat |
|---|---|
| `<title>` dupliqué | **0** |
| `meta description` manquante | **0** |
| `<h1>` ≠ 1 | **0** (toutes = 1) |
| `rel="canonical"` manquant | **0** |
| `og:image` manquant | **0** sur 12 articles testés |
| `og:url` | `https://riversmag.com` |
| canonical | `https://riversmag.com` (apex) |
| www → apex | **308** ✅ |

---

## 7. Sitemap & robots

**225 URLs :**

| Segmented | URLs |
|---|---|
| `articles` | 85 |
| `destinations` | 76 |
| `activities` | 28 |
| `hotels` | 9 |
| `itineraries` | 6 |
| `resources` | 5 |
| pages statiques | 16 |

- **Échantillon 35 URLs → 0 non-200** ✅
- Incohérence : 85 articles dans le sitemap dont 63 hors hub → 22 hub listés (les hubs valides) + sources à réconcilier Phase 3
- `robots.txt` : `Disallow: /admin/ /api/ /out/ /search /printables/` ✅

---

## 8. Affiliation

| Contrôle | Résultat |
|---|---|
| `/out/` testés | **3/3 → HTTP 302** |
| Paramètre `placement` préservé | ✅ |
| `rel="sponsored"` | déjà présent dans `AffiliateButton` |

```
cmthgttvg001ih8vjexw1w5z2 → tp.media (campaign 541, Airalo)          302
cmthy4m85001cdsvj2ujrbg0j → skyscanner.net (AID 7707607)             302
cmthy4nu4001fdsvj6hjol4ac → safetywing.com/nomad-insurance           302
```

---

## 9. Baseline qualité (avant travaux)

| Check | État |
|---|---|
| `npm run lint` | ❌ exit 2 → **RÉPARÉ** (`eslint` 10 → 9.39, commit `d372c6e`) |
| `npm run typecheck` | ✅ exit 0 |
| `npm test` | ✅ 48/48 |
| `npm run build` | ✅ exit 0 |

**Cause du lint cassé :** `eslint-plugin-react@7.37.5` déclare `peer: eslint '^3 || … || ^9.7'` — c'est la dernière version, **rien ne supporte ESLint 10**. Le bump `77cb6ac` (9 → 10) a cassé chaque run avec `contextOrFilename.getFilename is not a function` (ESLint 10 a supprimé `context.getFilename()`).

---

## 10. État production

| Contrôle | Dernier relevé |
|---|---|
| `/api/health` | `200` — `{"status":"ok","database":"up","latencyMs":15}` |
| Pages critiques | 14/14 × 200 |
| `/destinations` — liens | 150 |
| Module affilié noté | **absent** |
| Section « Book by destination » | **absente** |

⚠️ Le commit `main` contient ces deux améliorations, mais elles ne sont **pas visibles**. Suspicion de cache CDN / `_next` Hostinger. **À résoudre avant Phase 7** — sinon le QA mesure un état périmé.

---

## 11. Blocages

| # | Blocage | Impact |
|---|---|---|
| 1 | **Credential DB local invalide** — `password authentication failed for user 'neondb_owner'` (direct **et** pooler) | **Phase 1 impossible** : aucun import en base depuis cette machine |
| 2 | **`AUTH_SECRET` local = placeholder** `change-me-to-a-long-random-string` | S'il est identique en prod → sessions forgeables. À vérifier côté Hostinger |
| 3 | **`FOURTHWALL_TOKEN` / `FOURTHWALL_SHOP_DOMAIN` absents** | `/shop` → 404, Phase 5 bloquée |
| 4 | **Pas d'accès hPanel / Search Console / GA4** | Cache à purge, métriques indisponibles |
| 5 | **Pas de runner Lighthouse / axe / appareil mobile** | Phase 7 points 8 et 9 non mesurables ici |
| 6 | **Droits images non confirmés** (déclarés par l'auteur lui-même) | 105 images non publiées |
| 7 | **Aucune info auteur** | Phase 4 — pas de bio à inventer |

→ détail complet dans `NEEDS_MY_INPUT.md`

---

## 12. Plan proposé

| Phase | Travaux | Faisable sans DB ? |
|---|---|---|
| 0 | Audit | ✅ fait |
| 1 | Import 4 articles + conversion images | ❌ **bloqué** |
| 2 | Hub 404 ✅, `/shop`+`/printables`, 404, formes | ✅ partiel |
| 3 | Sitemap, canonical, fallback Overview, maillage | ✅ |
| 4 | Auteurs, last-updated, disclosure, cookies | ✅ partiel |
| 5 | CTA, ads slots, newsletter, shop | ❌ shop bloqué |
| 6 | Perf, analytics, a11y, Pinterest | ✅ partiel |
| 7 | QA loop → 0 erreur | ⚠️ sans Lighthouse |
| 8 | Livrables (3 fichiers) | ✅ |

---

## Méthode

- Crawl : `Invoke-WebRequest` sur production, 30–90 s de timeout, `-MaximumRedirection 0` pour les statuts
- Fichiers source : **lecture seule**, extraction via `scripts/extract-docx.ps1` → `tmp/import/*.json`
- Les originaux n'ont **jamais** été modifiés
- Aucun chiffre inventé ; les éléments invérifiables sont listés en §11 plutôt qu'affirmés
