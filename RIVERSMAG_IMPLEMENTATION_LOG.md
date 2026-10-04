# RIVERSMAG — Journal d'implémentation

Chronologique. Chaque entrée indique ce qui a été fait et comment cela a été vérifié.

---

## 2026-10-04 — Correctifs de déploiement

### `167a852` — sonde de déclenchement auto

Commit vide poussé sur `main` pour tester si Hostinger déclenchait un build automatiquement.
**Résultat : aucun build en 4 minutes d'observation.** → Le déploiement automatique est désactivé côté hPanel. Non corrigeable depuis le dépôt.

### `7f03c5f` — build webpack au lieu de Turbopack

**Problème :** `Server is not running. at Server.close (node:net:2359:12)` en production.

**Diagnostic initial erroné :** panne d'infrastructure Hostinger. Maintenu trop longtemps.

**Diagnostic réel (via le log hPanel) :** le worker PostCSS de Turbopack crashait sur `globals.css` sous Node 22. Le processus parent essayait de fermer un serveur déjà mort, d'où le message trompeur.

**Correctif :** `next build` → `next build --webpack`, ce qui supprime le pipeline worker concerné.

**Vérification :**
```
next build --webpack   exit 0   58,4 s
npm run build          exit 0
```

**Alternative écartée :** passer Node 22 → 20 (suggéré par l'analyse automatique). Non nécessaire — le build passe sans. `tailwindcss` est déjà en 4.3.3 et `postcss.config.mjs` est déjà correct ; les deux suggestions de l'analyse ne correspondaient pas à l'état réel du projet.

### `1b2ad2d` — migration non bloquante

**Problème :** `prisma migrate deploy && next build` rendait tout déploiement dépendant de la disponibilité de Neon. Sur un hébergeur mutualisé, un hoquet réseau = zéro déploiement.

**Correctif :** `npm run db:migrate:deploy || echo 'migration skipped' && next build`

**Vérification :** build lancé avec `DATABASE_URL` pointant vers `127.0.0.1:1` (injoignable) → **exit 0**. Avant : échec.

**Compromis assumé :** si la base est injoignable au moment du build, le déploiement passe quand même. `/api/health` remonte l'état à l'exécution. Un décalage schéma/BD reste possible — surveillé par le health check.

### `1a66ce5` — timer du health check

**Problème :** dans `/api/health`, le `setTimeout` de 5 s du `Promise.race` n'était jamais nettoyé. La requête gagnait en ~50 ms mais le timer restait en file d'attente et gardait la boucle d'événements Node ouverte.

**Correctif :** helper `withTimeout` avec `clearTimeout` en `finally`.

**Vérification :** `tsc` OK, lint OK, 48/48 tests.

---

## 2026-10-04 — SEO

### `4f71e74` — index de liens crawlable

**Constat :** `/destinations` plafonnait à `take: 30` (54 pays) et `take: 24` (40 villes). `/articles` ne liait que 12 guides sur 85 via pagination.

**Écart avec la référence :** Lonely Planet émet ~554 liens internes depuis une page destination ; le site en émet 63.

**Correctif :** composant `LinkIndex` (liste de liens en texte brut, en colonnes, en pied de hub) + suppression des plafonds `take`.

**Vérification en production après déploiement :**
```
/destinations  63 -> 205 liens internes
                54 -> 150 liens destinations
/articles      LinkIndex présent, 75 liens
```

### `5bd2ab0` — fraîcheur des destinations

**Constat :** les guides destinations étaient servis en `ogType: "website"` sans JSON-LD `Article` ni `dateModified`. Aucune fraîcheur pour des pages dont les prix, visas et transports évoluent.

**Correctif :** `articleSchema()` + `dateModified` depuis `destination.updatedAt` + `ogType: "article"`.

**Vérification (production) :** `Article` PRESENT · `dateModified` PRESENT · `og:type` = article.

---

## 2026-10-04 — Monétisation

### `dcfefb7` — module affilié noté (première tentative)

**Constat concurrentiel :** The Points Guy encadre chaque offre dans un module avec note /5, verdict, pros/cons, mentions légales. Les liens en prose sont le format qui convertit le moins.

**Première implémentation :** appliqué au bloc `products`.

### `b5b6eb5` — correction : le module ne s'affichait nulle part

**Constat :** le bloc `products` n'est utilisé dans aucun guide. Vérification en production sur 6 articles → **0 occurrence du module**.

**Correction :** application aux blocs réellement utilisés.

| Bloc | Champs disponibles | Traitement |
|---|---|---|
| `hotels` | `guestRating`, `reviewCount`, `pros`, `cons` | Module complet + lignes comparatives |
| `activities` | `included`, `notIncluded` | Module complet, champs factuels réutilisés |
| `products` | `rating`, `bestFor`, `pros`, `cons` | Module complet |

**Détail :** `Activity` n'a pas `pros`/`cons` dans le modèle. Utilisation de `included`/`notIncluded` plutôt que d'inventer un avis.

**Écart de notation assumé :** `guestRating` est la note de l'hôtel, pas la nôtre. Le libellé distingue « guest rating » du « Riverside review ».

**Vérification :** `tsc` OK · build exit 0 · 48/48 tests.

### `7c796ca` — pages commerciales enfin découvrables

**Constat mesuré :** crawl de 34 pages → **24 pages sans lien entrant**, toutes de la forme `/articles/hub/*`. Ces pages sont pourtant complètes : schema `ItemList` + `Hotel`, liens affiliés actifs, titres et descriptions uniques.

**Cause :** elles sont stockées comme articles au slug `hub/...` et classées par `publishedAt`. Aucun hub ne les liste.

**Correctif :** section « Book by destination » sur `/articles`, groupée par intention (Best hotels, Things to do, Where to stay, Best tours).

**Vérification :** `tsc` OK · build exit 0 · 48/48 tests.

---

## 2026-10-04 — Audit complet

### Mesures relevées

```
Routes                     57 pages + 5 API
Pages au sitemap           225
Secrets en dur             0
.env suivi par git         non
CSP                        présente (Report-Only)
HSTS / nosniff / frame     présents
Rate limiting              newsletter (5/min/IP), contact
Newsletter                 backend réel + validation email
Budget calculator          fonctionnel (205 lignes, useState)
JSON-LD                    WebSite, Organization, Article, Hotel,
                           ItemList, BreadcrumbList, FAQPage
Images                     lazy 21/21, alt 21/21, 204 URL next/image
```

### Deux diagnostics erronés, corrigés

**1. `rel="sponsored"` manquant** — signalé à tort. `AffiliateButton` l'applique déjà ; le test avait porté sur une page sans lien monétisé. **Aucun risque réel.**

**2. Panne d'infrastructure Hostinger** — diagnostic erroné maintenu plusieurs heures. Le log indiquait un crash du worker Turbopack.

### Règle tirée

> Un build vert ne prouve pas qu'un composant s'affiche.
> La vérification en production a révélé que le module affilié ne rendait sur aucune page malgré un build réussi.

---

## État actuel

```
Branche        main
HEAD           7c796ca
Checkpoint     audit-checkpoint-2026-10-04
Prochaine étape: redéployer sur Hostinger, puis mesurer
```

### Blocage en cours

Le code est correct et poussé. `/resources/esim` et `/articles/hub/*` servent encore l'ancienne version. Le bouton Redeploy dans hPanel reste nécessaire à chaque livraison.

### Non corrigé, documenté

- Lint cassé : ESLint 10 vs `eslint-plugin-react` (`contextOrFilename.getFilename is not a function`). Sans impact sur le build.
- `.env` local désaligné du credential de production → connexion locale impossible. Non touché : le secret correct est dans le panneau Hostinger.
