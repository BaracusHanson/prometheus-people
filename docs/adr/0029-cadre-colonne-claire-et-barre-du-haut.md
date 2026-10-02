# ADR-0029 — Cadre de l'espace recruteur : colonne claire et barre du haut contextuelle

- **Statut** : Accepté
- **Date** : 2026-10-03
- **Modifie** : [ADR-0020](0020-interface-et-design.md) (mise en page de l'espace recruteur)
- **Ticket** : #44

## Contexte

Après le passage à l'accent braise et au fond ivoire (ADR-0028), la colonne de navigation encre de 88 px jurait avec le reste : libellés de 11 px coupés sur deux lignes, nom de l'agence invisible, bouton d'invitation sans texte, compte réduit à deux initiales en bas. Le fondateur demandait aussi une barre du haut. L'ADR-0020 l'avait écartée : « 56 px de hauteur perdus, contraires à l'objectif sans défilement ».

Mesures faites avant de décider (mode aperçu, 1536 × 740) :

- une barre de 52 px **ajoutée** au-dessus du contenu coupe le tableau de bord (troisième relance, anneau de complétion) et les analyses (valeurs des barres de qualité) ;
- une barre qui **reprend** ce qui occupait déjà de la hauteur (titre, fil d'Ariane, période, actions de page, bandeau d'aperçu) ne coûte presque rien ; avec une colonne de 216 px, tableau de bord et analyses tiennent encore sans défilement.

## Décision

- **Colonne de navigation claire et libellée** : fond blanc, 220 px sur grand écran (marque, nom de l'agence, « Inviter un candidat » en toutes lettres, libellés sur une ligne, élément actif en braise pâle avec un trait de braise, forfait écrit « 5 / 10 candidats · essai » avec sa barre). Repliable en icônes (76 px) ; le choix est gardé dans un cookie `pp_colonne`, lu par le serveur, sans saut à l'affichage. Toujours repliée sur tablette.
- **Barre du haut contextuelle**, rendue par chaque page via `EnTetePage` (donc présente dans le HTML du serveur) : fil d'Ariane et titre (`h1`) à gauche ; actions de la page, période, pastille d'aperçu et menu du compte à droite. Elle reste visible au défilement. Elle remplace l'ancien en-tête dans le contenu et le bandeau d'aperçu, sans hauteur en plus. Le compte et l'aperçu lui parviennent par un contexte fourni par le cadre.
- **Téléphone** : barre du haut claire (marque, agence, invitation, compte) et navigation en bas, claire, élément actif en braise.
- Le tableau de bord affiche deux relances sur grand écran (« et N autres » ensuite) pour ne jamais rogner la carte.
- Recherche de candidat dans la barre (Ctrl+K) : reportée à une PR séparée, avec tests d'isolation entre agences et revue de sécurité ; un nom ne passe jamais dans une adresse.

## Options écartées

- **Barre ajoutée au-dessus du contenu** : coupe le tableau de bord et les analyses (mesuré) ; il faudrait renoncer à « sans défilement ».
- **Garder la colonne encre en l'affinant** : reste en rupture avec l'identité ivoire ; libellés toujours à l'étroit dans 88 px.
- **Colonne d'icônes seules** : la plus compacte, mais moins lisible pour des recruteurs peu technophiles ; conservée seulement comme état replié.
- **Barre rendue par le cadre, titre injecté par un portail** : le titre n'apparaîtrait qu'après le JavaScript.

## Conséquences

- Toute nouvelle page de l'espace agence commence par `EnTetePage`, en premier élément, hors de tout conteneur de largeur limitée ; sinon elle n'a ni titre, ni compte, ni pastille d'aperçu.
- 144 px de largeur en moins pour le contenu sur grand écran (colonne dépliée) : les grilles du tableau de bord et des analyses ont été vérifiées à 1536 × 740.
- Critère de réexamen : une page qui ne tient plus sans défilement, ou des retours d'agences sur la colonne.
