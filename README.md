# STOA Web

Site vitrine de STOA, édité par CAB Ingénierie — France. Astro 4.16 et Tailwind, sortie statique. Canonique : https://www.gostoa.dev/. Anglais à la racine, français sous `/fr/`.

## Développement

```sh
npm ci
npm run dev
npm run build
npm run preview
```

L’installation demande les dépendances du lockfile. Dans un environnement sans réseau ni installation autorisée, se limiter aux vérifications locales disponibles ; le build reproductible reste à exécuter dans l’environnement de validation.

## Design commun

- Les valeurs des tokens de `src/styles/tokens.css` restent communes avec Labs ; les déclarations de fontes correspondent aux fichiers effectivement fournis.
- `src/styles/base.css` définit la grammaire papier/encre, les titres serif, le corps sans et les repères mono.
- Inter variable romain, Source Serif 4 variable romain/italique et JetBrains Mono statique sont auto-hébergés sous `public/fonts/`, avec leurs licences OFL. Voir `public/fonts/SOURCES.md`. Chaque face utilise `font-display: swap` ; seul Inter est préchargé. L’italique Inter n’a pas été fourni : aucun fichier absent n’est déclaré, le navigateur peut synthétiser cette variante.
- Les composants `shared/` fournissent le chrome, les icônes et le thème sans ressource graphique distante. Le cercle S historique est conservé ; le choix final de l’emblème Labs relève de Marketing.
- Le script synchrone du head lit le cookie `stoa-theme` avant le rendu. Un choix explicite écrit uniquement `light` ou `dark`, pour 12 mois, avec `Path=/; SameSite=Lax; Secure`. `Domain=.gostoa.dev` s’applique au domaine et à ses sous-domaines ; sur une autre origine, le cookie reste limité à l’hôte. La persistance requiert HTTPS. Durée et exemption de consentement restent à confirmer par Juridique.
- Le thème se resynchronise à l’activation d’un onglet ; sans choix, le CSS suit le système, même sans JavaScript. Le menu et la copie sont progressifs, la FAQ utilise les éléments natifs.

## Contenu et périmètre

Le code publié de STOA est open source, sous licence Apache 2.0.

STOA's published code is open source under the Apache 2.0 licence.

Sources publiques du produit : [stoa-platform/stoa](https://github.com/stoa-platform/stoa) et [stoa-platform/stoa-quickstart](https://github.com/stoa-platform/stoa-quickstart). Les autres composants ne sont pas publiés. La licence du code publié ne couvre ni les services, ni ces composants, ni la marque, ni les contenus.

iPaaS Souverain / Sovereign iPaaS a un positionnement européen. Enterprise est à la carte, sur devis : les CTA mènent à `/contact/` ou `/fr/contact/`. Aucun prix ni engagement de service n’est annoncé. STOA Labs est le service de conseil de CAB Ingénierie.

Les dictionnaires FR/EN, la FAQ visible, son JSON-LD et `public/llms*.txt` partagent ce périmètre. Contact : contact@gostoa.dev, par mailto uniquement. Aucun formulaire, traceur, mesure d’audience, cookie autre que le thème ni CDN tiers.

Les mentions légales (`/legal/`, `/fr/mentions-legales/`) et la confidentialité (`/privacy/`, `/fr/privacy/`) conservent les champs `[À COMPLÉTER : …]` inconnus. La marque « STOA Platform » est déposée à l’INPI, propriété de CAB Ingénierie ; numéro et classes restent à renseigner.

## Hébergement et publication

Cible : Scaleway Object Storage website + Edge Services, région Paris (France). Le déploiement via GitHub Actions sera traité dans une PR séparée ; aucun workflow n’est modifié ici. Vercel est conservé uniquement comme repli pendant la migration, avec `vercel.json` inchangé. Aucun identifiant de ressource n’est nécessaire dans cette documentation.

`trailingSlash: 'always'` et `build.format: 'directory'` produisent les pages sous `dist/<route>/index.html`. Les anciennes routes `/demo` et `/fr/demo` utilisent les redirections statiques Astro vers contact : meta refresh, réponse HTML 200, sans promesse de 301 HTTP. Les routes de retours restent disponibles.

Une seule erreur bilingue est produite : `dist/404.html`, avec `noindex` et liens vers `/` et `/fr/`. La page d’erreur doit être servie avec un statut 404 réel. Les métadonnées, le sitemap et les fichiers de découverte utilisent www.

La CSP en meta et la politique de référent sont un repli partiel. Faire contrôler les en-têtes réellement servis, les routes avec et sans barre finale, les redirections, les deux langues, les ressources, les thèmes et les cookies en préproduction. La documentation de recette de la livraison détaille les routes attendues. La mise en ligne nécessite la validation des textes légaux et des lieux/durées de traitement ; elle n’est pas effectuée par cette refonte.
