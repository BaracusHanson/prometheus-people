# ADR-0028 — Site public : accent « braise », fond ivoire et animations avec Motion

- **Statut** : Accepté
- **Date** : 2026-10-02
- **Modifie** : [ADR-0020](0020-interface-et-design.md) (couleurs, animations) pour le site public seulement

## Contexte

La direction artistique du site public (fichier de design du fondateur, non versionné) demande un site « produit d'abord » : le profil candidat se construit à l'écran, le défilement raconte la transformation des réponses en profil, et une couleur signature rouge-orangé profond sur une base claire et chaude. L'ADR-0020 réservait au bleu le rôle de seule couleur active, au rouge les erreurs, et limitait les animations à une par écran, en CSS. Ces règles visent l'outil de travail du recruteur et le parcours du candidat ; elles brident un site de présentation dont le rôle est de montrer le produit en mouvement.

## Décision

**Couleurs, site public uniquement** (pages de `src/app/(site)`, page 404, composants `src/components/vitrine`) :

| Jeton                   | Rôle                                                                               |
| ----------------------- | ---------------------------------------------------------------------------------- |
| `braise` #C2410C        | accent signature : bouton principal, état actif, donnée à regarder, point de focus |
| `braise-fonce`, `-pale` | survol, fond d'un élément mis en avant                                             |
| `ivoire`, `ivoire-2`    | fond du site, bandeaux                                                             |
| `ligne`                 | trame et séparateurs sur fond ivoire                                               |

Contrastes : braise sur ivoire 4,7:1, blanc sur braise 5,2:1. L'accent ne qualifie jamais un trait : les rangs restent tracés à l'encre, la braise ne désigne que le point sur lequel on attire l'attention. L'espace recruteur, la connexion et le parcours candidat gardent le bleu et les règles de l'ADR-0020.

**Animations, site public uniquement** : bibliothèque **Motion** (`motion`, ex-Framer Motion), chargée par `LazyMotion` (fonctions d'animation du DOM seulement). Elle ne s'importe que dans `src/components/vitrine` (règle ESLint), et seules les pages qui animent (accueil, tarifs) chargent son fournisseur : le cadre du site (en-tête, pied, page 404) reste sans Motion, car Next le charge aussi hors du site public, jusque sur les pages du candidat (vérifié sur le build). Chaque animation montre une transformation du produit (invitation → réponses → mesures → profil) ; pas d'animation permanente ni décorative. `MotionConfig reducedMotion="user"` : avec « moins d'animations », les éléments arrivent directement dans leur état final. Le serveur rend une page lisible avant toute animation.

## Options écartées

- **Tout en CSS** (première version de la refonte) : suffisant pour des apparitions, mais le récit lié au défilement (positions interpolées en continu, indicateurs qui glissent d'un élément à l'autre, transitions de mise en page) devient du code fragile écrit à la main.
- **GSAP + ScrollTrigger** : plus puissant pour le défilement, mais impératif (hors du modèle React), et la licence des greffons avancés est moins simple.
- **Accent dans toute l'application** : refonte de dizaines d'écrans validés, et risque de confusion avec le rouge des erreurs dans un outil de travail ; à rediscuter à part.

## Conséquences

- Environ 50 Ko compressés de JavaScript en plus sur l'accueil et les tarifs ; aucun sur `/passation` (moins de 100 Ko exigés par l'ADR-0020) ni dans l'espace recruteur.
- Une nouvelle surface de couleur : toute nouvelle page publique utilise ces jetons, pas le bleu.
- Critère de réexamen : temps d'affichage du site public dégradé (Largest Contentful Paint > 2,5 s en 4G), ou décision d'étendre l'accent à l'application.
