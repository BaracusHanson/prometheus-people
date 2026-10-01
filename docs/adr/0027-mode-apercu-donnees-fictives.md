# ADR-0027 — Mode aperçu avec des données fictives

- **Statut** : Accepté
- **Date** : 2026-10-01
- **Précise** : [ADR-0020](0020-interface-et-design.md) (« agence de démonstration aux données fictives »), [ADR-0012](0012-depot-public-sans-github-pro.md)

## Contexte

Une agence qui démarre voit des écrans vides ; pour une démonstration ou pour vérifier une page, il faut voir chaque composant rempli (tableau de bord, liste, profil, comparaison, journal). Les vrais résultats de candidats sont des données sensibles : des données fictives ne doivent jamais s'y mêler.

## Décision

- Un **interrupteur dans Paramètres** (« Données fictives », administrateurs) active un mode aperçu. C'est un **cookie** (`pp_apercu`, `httpOnly`, 8 heures) dans le navigateur de la personne : il ne change que ce qu'elle voit.
- En aperçu, les pages lisent 40 candidats **générés en mémoire** (`src/modules/apercu/donnees.ts`, graine fixe, dates relatives au jour) au lieu de la base. **Rien n'est écrit** : ni candidat, ni journal, ni forfait. Les vrais candidats sont **masqués**, jamais mélangés.
- Un **bandeau ambre** sur chaque page dit que les données sont fictives et permet de revenir aux vraies (tout membre peut couper l'aperçu).
- Relancer et supprimer sont désactivés ; la lecture d'un profil fictif n'est pas notée au journal. Inviter un candidat reste un vrai envoi.
- Les noms sont des prénoms et noms courants, les adresses en `@exemple.test`, les identifiants commencent par `00000000-0000-4000-8000-` : aucune personne réelle (ADR-0012).

## Options écartées

- **Créer des candidats fictifs en base** : plus réaliste (toutes les actions marchent), mais ils se mêlent aux vrais, comptent dans le quota, apparaissent dans le journal, les sauvegardes et la purge, et il faut penser à les effacer.
- **Agence de démonstration séparée** : la bonne réponse pour les démos commerciales, prévue par l'ADR-0020, mais elle demande un compte et des données en base ; l'aperçu couvre le besoin immédiat sans rien stocker.

## Conséquences

- Chaque page qui lit des candidats choisit sa source avec `lireApercu()` ; une nouvelle page (Analyses) doit faire de même.
- Un recruteur ne peut pas activer l'aperçu (Paramètres est réservé aux administrateurs) mais peut le couper.
- Critère de réexamen : besoin d'une démonstration partagée entre plusieurs comptes (passer alors à l'agence de démonstration).
