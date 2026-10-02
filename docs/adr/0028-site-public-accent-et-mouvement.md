# ADR-0028 — Accent « braise », fond ivoire et animations avec Motion

- **Statut** : Accepté
- **Date** : 2026-10-02
- **Modifie** : [ADR-0020](0020-interface-et-design.md) (couleurs, maquette de référence, animations)
- _(Modifié le 2026-10-02 : les couleurs s'étendent à tout le produit, après validation de l'accueil par le fondateur.)_

## Contexte

La direction artistique du site public (fichier de design du fondateur, non versionné) demande un site « produit d'abord » : le profil candidat se construit à l'écran, le défilement raconte la transformation des réponses en profil, et une couleur signature rouge-orangé profond sur une base claire et chaude. L'ADR-0020 réservait au bleu le rôle de seule couleur active, au rouge les erreurs, et limitait les animations à une par écran, en CSS. Ces règles visent l'outil de travail du recruteur et le parcours du candidat ; elles brident un site de présentation dont le rôle est de montrer le produit en mouvement.

## Décision

**Couleurs, dans tout le produit** (site public, espace recruteur, connexion, pages du candidat) :

| Jeton                                 | Rôle                                                                   |
| ------------------------------------- | ---------------------------------------------------------------------- |
| `braise` #C2410C                      | actions, liens, élément actif, focus, point sur lequel on attire l'œil |
| `braise-fonce`, `-pale`               | survol et texte de lien ; élément sélectionné                          |
| `fond` / `ivoire` #F7F4EE, `ivoire-2` | fond des pages ; bandeaux, zone moyenne, élément neutre sélectionné    |
| `ligne`, `bordure`, `trait`           | trame, contours et séparateurs, en tons chauds                         |
| `chart-1` à `chart-5`                 | échelle des graphiques, de l'ivoire à l'encre                          |

Le bleu disparaît. Contrastes : braise sur ivoire 4,7:1, blanc sur braise 5,2:1, lien `braise-fonce` sur ivoire 7:1, contour des champs 3,2:1. Les **données sont tracées à l'encre** ; l'accent ne qualifie jamais un trait et ne mesure jamais une quantité. L'ambre (attention), le vert (terminé, réponses fiables) et le rouge (erreurs) gardent leur rôle de l'ADR-0020 ; le statut « En cours » devient neutre. Un statut est toujours écrit, jamais porté par la couleur seule. Le choix d'une réponse du candidat est à l'encre : une réponse n'est ni bonne ni mauvaise. Ce design remplace la maquette validée citée par l'ADR-0020 ; les captures de référence avant changement sont jointes au ticket du chantier.

**Animations** — site public : bibliothèque **Motion** (`motion`, ex-Framer Motion), chargée par `LazyMotion` (fonctions d'animation du DOM seulement). Elle ne s'importe que dans `src/components/vitrine` (règle ESLint), et seules les pages qui animent (accueil, tarifs) chargent son fournisseur : le cadre du site (en-tête, pied, page 404) reste sans Motion, car Next le charge aussi hors du site public, jusque sur les pages du candidat (vérifié sur le build). Chaque animation montre une transformation du produit (invitation → réponses → mesures → profil) ; pas d'animation permanente ni décorative. `MotionConfig reducedMotion="user"` : avec « moins d'animations », les éléments arrivent directement dans leur état final. Le serveur rend une page lisible avant toute animation. Espace recruteur : animations sobres d'outil de travail (transitions d'état, chiffres, graphiques qui se dessinent, survols précis), jamais de récit au défilement ni d'attente imposée ; la règle ESLint est élargie quand ces composants arrivent. Pages du candidat : jamais de Motion.

## Options écartées

- **Tout en CSS** (première version de la refonte) : suffisant pour des apparitions, mais le récit lié au défilement (positions interpolées en continu, indicateurs qui glissent d'un élément à l'autre, transitions de mise en page) devient du code fragile écrit à la main.
- **GSAP + ScrollTrigger** : plus puissant pour le défilement, mais impératif (hors du modèle React), et la licence des greffons avancés est moins simple.
- **Garder le bleu dans l'application** (décision initiale de cet ADR) : deux identités pour un même produit ; écarté par le fondateur après validation de l'accueil. Le risque de confusion entre braise, ambre et rouge est traité en écrivant toujours le statut et en traçant les données à l'encre.

## Conséquences

- Environ 50 Ko compressés de JavaScript en plus sur l'accueil et les tarifs ; aucun sur `/passation` (moins de 100 Ko exigés par l'ADR-0020) ni dans l'espace recruteur.
- Une nouvelle surface de couleur : toute nouvelle page publique utilise ces jetons, pas le bleu.
- Critère de réexamen : temps d'affichage du site public dégradé (Largest Contentful Paint > 2,5 s en 4G), ou décision d'étendre l'accent à l'application.
