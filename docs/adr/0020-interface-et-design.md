# ADR-0020 — Interface : styles, composants, graphiques, accessibilité, référencement

- **Statut** : Accepté
- **Date** : 2026-09-29

## Contexte

Jusqu'à l'étape 6, l'application n'avait aucun style. Avant l'invitation des candidats (étape 7), toutes les pages ont été maquettées puis validées : tableau de bord et analyses, candidats, équipe, paramètres, parcours candidat sur mobile, site public, connexion. La maquette (canevas privé, ADR sans lien public) sert de référence visuelle ; cet ADR fixe les règles qui s'appliquent au code.

## Décision

**Outils**

- **Tailwind CSS v4**, via PostCSS. Les jetons de design sont déclarés une seule fois dans `src/app/globals.css` (`@theme`).
- **Composants** : **shadcn/ui** (style `radix-nova`, primitives Radix, icônes Lucide), copiés dans `src/components/ui` et **adaptés** : leurs variables pointent vers nos jetons, les boutons et champs font 44 px, variantes ajoutées pour nos badges et messages (neutre, info, succès, attention, erreur). On ajoute un composant avec `pnpm dlx shadcn@latest add <nom>` au lieu de le réécrire. Fusion des classes par le paquet `cn` (publié par shadcn, sans dépendance). Pas de bibliothèque au style imposé (MUI, Chakra), pas de CSS-in-JS. _(Modifié le 2026-09-29 : shadcn/ui installé comme base dès maintenant, au lieu de composants maison.)_
- **Graphiques** : ceux de shadcn/ui (Recharts) pour les courbes, barres et anneaux de **l'espace recruteur uniquement** ; SVG fait maison pour le rapport candidat, la carte de chaleur et le nuage de points ; `d3-sankey` pour **calculer** le diagramme de parcours, dessiné par nous. Aucun graphique en radar.
- **Police** : Archivo, une seule famille, avec son axe de largeur (étroite pour les chiffres et les titres). Servie par `next/font` depuis notre domaine : le navigateur ne contacte jamais Google (RGPD).

**Couleurs** : chaque couleur a un rôle, et une couleur absente des jetons n'existe pas.

| Jeton                                       | Rôle                                                   |
| ------------------------------------------- | ------------------------------------------------------ |
| `encre` #1B2230                             | texte, colonne de navigation                           |
| `bleu` #2344A8                              | données et actions : la seule couleur « active »       |
| `bleu-clair`, `bleu-pale`                   | données secondaires, zone moyenne, sélection           |
| `ambre` #D97706, `ambre-texte`              | **attention uniquement** : relances, pertes, seuils    |
| `vert`                                      | terminé, réponses fiables — jamais pour juger un trait |
| `rouge`                                     | erreurs et suppressions uniquement                     |
| `gris`, `bordure`, `trait`, `champ`, `fond` | texte secondaire, contours, fonds                      |

Jamais de rouge ni de vert pour qualifier un candidat : un trait bas n'est pas « mauvais ».

**Mise en page**

- Espace recruteur : **colonne de navigation à gauche** de 88 px (icône et libellé), qui ne coûte aucune hauteur ; sur mobile, barre de navigation en bas. La colonne porte aussi le bouton « Inviter un candidat » (action principale, un seul tiroir pour toute l'application), le compteur du forfait et le menu du compte (déconnexion). Ce cadre est rendu une fois par le layout du groupe de routes `(app)/(cadre)` ; chaque page revérifie quand même ses droits.
- Tailles de référence : mobile 390 px, tablette 834 px, **portable 1536 × 740** (1920 × 1080 à 125 %, moins le navigateur), grand écran 1920 px.
- **Le tableau de bord et les analyses tiennent sans défilement à partir du portable.** Sur tablette et mobile, on défile, dans l'ordre : chiffres clés, relances, candidats, graphiques.
- Parcours candidat pensé d'abord pour le téléphone : texte de 16 à 17 px, boutons de 52 px, une action par écran, nom de l'agence en tête.

**Accessibilité** (visée : WCAG 2.2 AA, équivalent RGAA)

- Contraste 4,5:1 pour le texte ; focus visible au clavier partout ; cibles tactiles de 44 px minimum sur mobile et tablette.
- Champs avec libellé visible, aide et erreur reliées au champ ; une erreur dit quoi corriger.
- Un graphique n'utilise jamais la couleur seule : valeurs écrites, formes différentes, équivalent textuel.
- Animations sobres (une par écran au plus), désactivées si l'utilisateur a demandé moins d'animations.
- Tests automatiques d'accessibilité (axe) avec Playwright, quand les tests de bout en bout arriveront.

**Référencement et confidentialité**

- Seules les pages publiques du site sont indexées : titres et descriptions, `sitemap.xml`, `robots.txt`, images de partage, données structurées `Organization` et `SoftwareApplication`.
- L'espace agence, la connexion et le parcours candidat sont en `noindex`. Les pages qui portent un jeton dans l'URL envoient `Referrer-Policy: no-referrer`. Aucun outil de mesure d'audience sur les pages candidat.
- Le site public ne contient ni faux témoignage, ni faux logo client, ni chiffre inventé, ni le mot « validé » (ADR-0019).

**Règles des graphiques et du tableau de bord**

- Chaque graphique répond à une question du recruteur et porte sa phrase de conclusion.
- Aucune répartition par sexe, âge ou origine ; aucune « prédiction » ; aucun classement automatique des candidats (RGPD art. 22, AI Act) : comparaison côte à côte seulement.
- La répartition des profils par poste n'apparaît qu'à partir de **10 candidats** pour ce poste, sans nom au survol, avec la mention « décrit vos candidats, pas le candidat idéal ».
- Une nouvelle agence voit un état vide utile (étapes à suivre, aperçu grisé) ; une **agence de démonstration** aux données fictives sert aux démos commerciales.

**Performance** : composants serveur par défaut ; sur le parcours candidat, moins de 100 Ko de JavaScript et un affichage en moins de 2,5 s en 4G ; les bibliothèques de graphiques ne sont chargées que dans l'espace recruteur.

## Options écartées

- **CSS pur (CSS Modules)** : défendable, mais plus lent pour garder la cohérence sur trois surfaces.
- **Bibliothèques complètes (MUI, Chakra)** : style imposé, poids, difficile à rendre distinctif.
- **Storybook** : trop lourd ; les composants se vérifient dans les pages et par les tests.
- **Barre de navigation en haut** : 56 px de hauteur perdus, contraires à l'objectif « sans défilement ».
- **Mode sombre en v1** : outil de travail et rapport imprimé ; les jetons permettront de l'ajouter.
- **Graphique en radar, comparaison entre agences** : trompeur pour le premier, partage de données entre clients pour la seconde.

## Conséquences

- Une nouvelle couleur, une nouvelle police ou une bibliothèque de composants passe par une modification de cet ADR.
- Le site public complet, les pages Candidats, Analyses, Équipe, Paramètres et le parcours candidat sont construits aux étapes qui les introduisent, d'après la maquette.
- À compléter avant la mise en vente : prix et quota du forfait, lieu d'hébergement des données, adresse de contact RGPD de chaque agence, textes légaux.
- Critère de réexamen : retours d'agences sur la lisibilité, ou mesures d'abandon du parcours candidat.
