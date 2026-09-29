# ADR-0019 — Questionnaire IPIP-NEO-120 à la place du BFI-2-Fr

- **Statut** : Accepté
- **Date** : 2026-09-29
- **Remplace** : le choix du BFI-2-Fr dans [ADR-0010](0010-perimetre-v1.md) (parcours 3 et 5, et le moteur « repris du brouillon »)

## Contexte

L'ADR-0010 prévoyait le BFI-2-Fr, sous réserve d'une autorisation écrite d'usage commercial. Les auteurs ont **refusé**. Il faut un autre questionnaire de personnalité en cinq traits, utilisable commercialement, en français, sur mobile.

## Décision

**Questionnaire : IPIP-NEO-120** (Johnson, 2014), issu de l'International Personality Item Pool.

- **Domaine public** : le site de l'IPIP autorise la copie, la modification, la traduction et tout usage sans permission ni paiement. Les questions peuvent donc être versionnées dans ce dépôt public.
- **Structure** : 5 traits × 6 sous-dimensions = 30 sous-dimensions de 4 questions, dont **29 mesurées** : **116 questions**. Échelle de réponse en 5 points.
- **Sous-dimension exclue : O6 « Libéralisme »**. Ses questions portent sur le vote pour des candidats libéraux ou conservateurs et sur la sévérité envers les crimes : ce sont des opinions politiques, donnée sensible (RGPD art. 9), motif de discrimination (Code du travail L1132-1), sans lien avec le poste (L1221-6). Elles ne sont jamais posées. L'Ouverture est donc la moyenne de 5 sous-dimensions ; son rang global, calculé avec les normes publiées sur 6, est affiché comme **approximatif**.
- **Français** : l'adaptation en français de France de l'IPIP-NEO-300 (Thiry et Piolti, 2023, à partir de la traduction québécoise de Gravel). Les 120 questions sont un sous-ensemble des 300. Le texte exact est ajouté par une PR distincte, avec sa source.
- **Durée** : environ 15 à 20 minutes sur téléphone.
- **Clé de correction** : liste officielle de Johnson (IPIP-NEO-120) et ordre de l'IPIP-NEO-300 (question n → sous-dimension `(n − 1) mod 30`). La colonne des sous-dimensions de la traduction québécoise publiée sur le site de l'IPIP est **erronée** pour de nombreuses questions, et deux de ses traductions contredisent l'anglais : elle ne sert jamais de clé.

**Rien du BFI-2 n'est repris** : ni questions, ni reformulations, ni barèmes, ni le moteur et les données du brouillon (`lib/scoring.ts`, `data/bfi2_fr_data.json`).

**Calcul** (Kajonius et Johnson, 2019, CC BY 4.0) :

- une réponse va de 1 à 5 ; une question inversée vaut `6 − réponse` ;
- une sous-dimension est la **somme** de ses 4 questions (de 4 à 20) ;
- un trait est la **moyenne** de ses sous-dimensions mesurées (de 4 à 20) ;
- le rang (percentile) est calculé par rapport aux moyennes et écarts-types publiés dans ce même article.

**Ce que l'on dit et ce que l'on ne dit jamais**

- L'adaptation française **n'est pas validée** (ses auteurs le disent) et il n'existe **pas de normes françaises**. Le mot « validé » n'apparaît **jamais** : ni dans l'application, ni dans les emails, ni dans la documentation commerciale.
- Formulation autorisée : « basé sur l'IPIP-NEO, inventaire scientifique du domaine public ».
- Les normes viennent de volontaires américains en ligne (N = 320 128), non représentatifs. Le rapport l'indique à côté de chaque rang.
- Faiblesses connues, signalées dans le rapport : la sous-dimension « Modestie » est presque indépendante de l'Agréabilité ; l'Ouverture est le trait le moins cohérent.

**Qualité des réponses** (Johnson, 2005) : le moteur signale les longues séries de réponses identiques, les questionnaires incomplets et les échecs aux questions de contrôle d'attention (questions à nous, hors IPIP, qui ne comptent dans aucun score). Il signale, il ne rejette pas : le recruteur voit un point de vigilance.

**Graphiques** : barres horizontales positionnées sur une échelle de rang, par trait puis par sous-dimension. Pas de graphique en radar : il déforme les écarts selon l'ordre des axes et se lit mal sur téléphone.

**Préparation d'un approfondissement** : chaque question est identifiée par son **numéro dans l'IPIP-NEO-300**. Un futur « test approfondi » ne poserait que les 180 questions restantes, sans rien reposer.

## Options écartées

- **Reformuler le BFI-2** : œuvre dérivée d'un questionnaire dont les auteurs ont refusé l'usage commercial.
- **IPIP-NEO-300 en v1** (40 à 50 minutes) : trop long pour de l'intérim, où le placement se fait en 24 à 48 heures ; abandons en cours de test ; proportionnalité discutable (Code du travail L1221-6 et L1221-8, minimisation RGPD) pour une mission courte.
- **50 questions « Big-Five markers »** (5 à 7 minutes) : 5 traits sans sous-dimensions, traduction québécoise uniquement.
- **Deux tests enchaînés (court puis long) en v1** : deux sollicitations du candidat, deux parcours à construire, alors que le 120 donne déjà un profil complet.
- **Version à 2 questions par sous-dimension** : trop peu fiable pour guider un recrutement.

## Conséquences

- Le rapport passe de 15 à **29 sous-dimensions** (ADR-0010, parcours 5).
- Les libellés du rapport restent neutres : jamais « Dépression » ni « Immodération » ; certaines questions touchent à l'intime (estime de soi, humeur, excès). Un avis juridique sur l'ensemble du questionnaire est recommandé avant le lancement commercial.
- La restitution au candidat (ADR-0010, parcours 6) montre ses traits et sous-dimensions, sans score d'adéquation au poste.
- Les questions, la clé de correction et les normes sont des données publiques versionnées ; CLAUDE.md règle 10 est mise à jour en ce sens.
- Un email de courtoisie aux auteurs de l'adaptation française est recommandé avant la mise en production ; leurs conditions d'usage ne sont pas précisées.
- Critère de réexamen : une adaptation française validée, avec normes, devient disponible ; ou des agences demandent l'approfondissement (IPIP-NEO-300) pour des postes où il se justifie (nouvel ADR).

## Sources

- IPIP : https://ipip.ori.org/ (statut de domaine public, traductions).
- Johnson, J. A. (2014). Measuring thirty facets of the five factor model with a 120-item public domain inventory. _Journal of Research in Personality_, 51, 78-89.
- Kajonius, P. J., & Johnson, J. A. (2019). Assessing the structure of the Five Factor Model of Personality (IPIP-NEO-120) in the public domain. _Europe's Journal of Psychology_, 15(2), 260-275. CC BY 4.0.
- Johnson, J. A. (2005). Ascertaining the validity of individual protocols from web-based personality inventories. _Journal of Research in Personality_, 39(1), 103-129.
- Thiry, B., & Piolti, M. (2023). IPIP NEO 300, adaptation française européenne.
