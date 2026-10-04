# RIVERSMAG — Audit & Rapport d'implémentation

Date : 2026-10-04 · Périmètre : `riversmag.com` · Branche : `main` · Checkpoint : `audit-checkpoint-2026-10-04`

Toutes les valeurs ci-dessous sont **mesurées** sur le site en production ou dans le dépôt local. Les éléments non vérifiables sont explicitement listés en section D.

---

## A. Audit initial — problèmes constatés

### A.1 Bugs critiques

| # | Problème | Preuve | État |
|---|---|---|---|
| 1 | **Build cassé en production.** Le worker PostCSS de Turbopack crashait sur `globals.css` sous Node 22 ; le parent remontait `Server is not running. at Server.close (node:net:2359:12)`, symptôme qui ressemble à une panne d'infrastructure. | Log Hostinger | **Corrigé** (`--webpack`) |
| 2 | **Déploiement automatique inactif.** 5 push consécutifs sur `main` n'ont déclenché aucun build. | Observation directe | **Non corrigé** — réglage hPanel |
| 3 | **Migration bloquante en tête de build.** `prisma migrate deploy && next build` faisait échouer tout déploiement si Neon était momentanément injoignable. | Test avec fausse URL | **Corrigé** (`\|\| echo …`) |
| 4 | **Timer non nettoyé** dans `/api/health` : `setTimeout` de 5 s laissait la boucle d'événements Node ouverte après une réponse en ~50 ms. | Lecture du code | **Corrigé** (`clearTimeout`) |
| 5 | **Module affilié sur un bloc mort.** Le composant noté avait été câblé sur le bloc `products`, non utilisé : les guides sont construits en blocs `hotel`, `activity`, `esim`. Le module ne s'affichait nulle part. | Vérification production : 0 occurrence sur 6 articles | **Corrigé** |

### A.2 Problèmes SEO

| # | Problème | Mesure | État |
|---|---|---|---|
| 6 | **Pages commerciales orphelines.** Les pages `/articles/hub/*` (best-hotels/tokyo, things-to-do/bali, where-to-stay/rome…) n'étaient liées depuis aucun hub : 0 lien entrant. | Crawl de 34 pages | **Corrigé** (section « Book by destination ») |
| 7 | **Plafonds invisibles sur `/destinations`.** `take: 30` sur 54 pays, `take: 24` sur 40 villes. | Lecture du code | **Corrigé** |
| 8 | **`/articles` ne liait que 12 articles sur 85** via pagination. | Lecture du code | **Corrigé** (`LinkIndex`) |
| 9 | **Destinations sans signal de fraîcheur.** `ogType: "website"`, aucun JSON-LD `Article`, aucun `dateModified`. | Inspection HTML | **Corrigé** |
| 10 | **Grilles sans hiérarchie commerciale.** Hôtels, activités et produits en cartes de poids égal : le lecteur n'a aucune raison de choisir. | Lecture du code | **Corrigé** (module noté) |

**Mesures de maillage avant / après :**

```
/destinations   63 liens internes  ->  205
/destinations   54 liens destinations -> 150
/articles       12 liens visibles  ->  75 liens + groupes commerciaux
```

### A.3 Performance

Mesuré sur la home, en production :

```
Temps de réponse        2 990 ms
Taille HTML             249 KB
Balises <script>        15
Images                  21 (0 sans attribut alt)
Images via next/image   204 URL d'optimiseur
loading="lazy"          21/21
```

Les images sont correctement optimisées (lazy loading, `sizes`, routeur `/_next/image`, `alt` systématique). Le JSON-LD ne pèse que ~1 KB : il n'est pas en cause dans les 249 KB.

### A.4 Accessibilité — socle vérifié

```
Un seul <h1> par page        OK
Skip-link présent            OK
Attribut lang sur <html>     OK
alt sur 21/21 images         OK
Champs de formulaire validés OK (regex email + rate limit 5/min/IP)
```

### A.5 Sécurité — aucun problème critique

```
Secrets en dur dans src/  : 0
.env suivi par git        : non
Gitignore protège .env     : oui
CSP                       : présente (Report-Only)
HSTS, X-Frame-Options, nosniff, Referrer-Policy : présents
Rate limiting             : newsletter, contact
```

### A.6 Monétisation

Liens d'affiliation échantillonnés (4 IDs) : tous redirigent en 302 vers les bons providers avec paramètres UTM corrects et `partner_id` réels.

```
getyourguide.com/s/?partner_id=K0KEBIE&q=Rome&utm_source=riversmag&...
booking.com/searchresults.en.html?ss=Marrakech&utm_source=riversmag&...
```

---

## B. Modifications implémentées

### B.1 Composants créés

| Fichier | Rôle |
|---|---|
| `src/components/affiliate/affiliate-module.tsx` | Module affilié encadré : note /5, verdict, pros/cons, CTA, mentions légales |
| `src/components/ui/link-index.tsx` | Index de liens crawlable réutilisable, colonnes, rendu en pied de hub |

### B.2 Fichiers modifiés

| Fichier | Modification |
|---|---|
| `src/app/destinations/[...path]/page.tsx` | JSON-LD `Article` + `dateModified` + `ogType: article` |
| `src/app/destinations/page.tsx` | Suppression des plafonds `take`, ajout du `LinkIndex` (76 destinations) |
| `src/app/articles/page.tsx` | `LinkIndex` (85 guides) + section « Book by destination » groupée par intention |
| `src/components/content-renderer.tsx` | Module noté appliqué aux blocs `hotels`, `activities`, `products` ; imports morts supprimés |
| `src/components/affiliate/affiliate-button.tsx` | Props `string \| null` (incohérence bloquante) |
| `src/app/api/health/route.ts` | `clearTimeout` sur le timeout |
| `package.json` | `next build --webpack` ; migration non bloquante |

### B.3 Corrections d'affiliation

Le `AffiliateButton` appliquait déjà `rel="sponsored"` — **ce risque n'existait pas**. Mon diagnostic initial était erroné sur ce point ; vérifié avant d'alerter.

---

## C. Résultats avant / après

| Mesure | Avant | Après |
|---|---|---|
| Build production | **échoué** | `exit 0` |
| Liens internes `/destinations` | 63 | **205** |
| Pages commerciales orphelines | 24 | **0** |
| `dateModified` sur destinations | absent | présent |
| Module affilié affiché | 0 page | hôtels, activités, produits |
| Commits en attente de déploiement | — | **0** |

**Vérifications exécutées :**

```
tsc --noEmit        0 erreur
next build          exit 0
npm test            48/48 pass
npm run lint        ÉCHEC (voir D.1)
```

---

## D. Problèmes restants

### D.1 Lint cassé — bloquant pour la CI

```
ESLint 10.12.0
TypeError: Error while loading rule 'react/display-name':
  contextOrFilename.getFilename is not a function
```

Incompatibilité entre ESLint 10 et `eslint-plugin-react` imbriqué dans `eslint-config-next`. Sans impact sur le build ni sur le site. **Non corrigé** : la correction demande de选择一个版本 d'ESLint compatible, ce qui est un choix technique à valider.

### D.2 Requêtes nécessitant des identifiants

| Besoin | Pourquoi | Qui fournit |
|---|---|---|
| Données Search Console | Priorisation SEO réelle, requêtes, positions | Compte Google Search Console |
| Search Console API | Suivi des impressions dans le temps | Idem |
| Plugin SEO / Rank Math | Audit de crawl complet, données de mots-clés | Choix propriétaire |
| Instagram / LinkedIn API | Partage social automatisé | Comptes sociaux |

### D.3 Non vérifiable dans cet environnement

- **Lighthouse / Core Web Vitals au 75e percentile** : non lancés. Aucun outil Lighthouse local disponible. Les mesures faites sont des timings manuels (TTFB inclus), **pas** des scores de laboratoire. Aucune donnée d'utilisateurs réels.
- **Comportement mobile réel** : analysé par lecture de code et `sizes` responsive, pas testé sur appareil physique.
- **Tests d'écran** : non effectués.
- **Revue d'accessibilité automatisée** (axe, Lighthouse a11y) : non lancée.

### D.4 Contenu nécessitant une revue humaine

- Les textes des 85 articles et 76 destinations n'ont pas été relus ligne à ligne.
- Aucune affirmation éditoriale n'a été ajoutée. Les notes sont présentées comme un jugement Riversmag, jamais comme un chiffre fournisseur.
- `lastReviewedAt` existe en base mais n'est alimenté par aucun processus automatisé.

### D.5 Documents légaux

`/privacy-policy`, `/terms`, `/cookie-policy`, `/editorial-policy`, `/affiliate-disclosure` existent et sont accessibles. Une **relecture juridique professionnelle est recommandée** — je ne peux pas la faire et je n'en ai pas inventé le contenu.

### D.6 Limite technique

Le build est passé de Turbopack à webpack. C'est un contournement, pas une résolution de fond : le crash du worker PostCSS sous Node 22 reste non expliqué. Webpack est plus lent (58 s contre 49 s en local). Revenir à Turbopack supposera d'investiguer `tailwindcss` 4.3.3 sous Node 22.

---

## E. Feuille de route 30 jours

### Semaine 1 — Débloquer et mesurer

1. Activer le déploiement automatique dans hPanel (`Deploy automatically → ON`, branche `main`). **C'est le blocage n°1 du moment.**
2. Corriger le lint (aligner ESLint et `eslint-plugin-react`).
3. Connecter Search Console et soumettre le sitemap.

### Semaine 2 — Traiter ce que dit la recherche

4. Identifier les 10 requêtes qui bringent du trafic mais convertissent mal. Priorité aux pages `/articles/hub/*` désormais indexables.
5. Vérifier dans Search Console que les 24 pages précédemment orphelines sont bien explorées.

### Semaine 3 — Conversion

6. Mesurer le taux de clic des modules notés vs ancien format (Search Console, ou `data-affiliate-click` existant).
7. Ajuster le libellé des CTA selon les données — sans deviner.

### Semaine 4 — Contenu et profondeur

8. Template destination à 9 onglets (meilleur temps de visitе, style Lonely Planet) sur les 5 destinations les plus stratégiques.
9. Tableau de données propriétaire (« coût moyen par destination ») — l'asset qui attire les backlinks.
10. Revue humaine des pages `/resources/*`, qui portent le trafic eSIM.

---

## Notes de méthode

Deux diagnostics se sont révélés faux et ont été corrigés en cours de route :

- **`rel="sponsored"`** : signalé comme manquant, il était déjà appliqué par `AffiliateButton`. Erreur de mesure sur une page sans lien monétisé.
- **Panne d'infrastructure Hostinger** : diagnostic maintenu trop longtemps. Le log de build indiquait un crash du worker Turbopack. Le contournement `--webpack` a fonctionné du premier coup.

Leçon appliquée : un build vert ne prouve pas qu'un composant s'affiche. La vérification en production a révélé que le module affilié ne rendait nulle part.
