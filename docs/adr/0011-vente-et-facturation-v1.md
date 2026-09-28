# ADR-0011 — Vente et facturation en v1

- **Statut** : Accepté
- **Date** : 2026-09-28

## Contexte
Aucun client payant. Le produit est un outil d'évaluation de personnalité utilisé pour des décisions d'embauche : un achat de confiance. Une intégration Stripe complète (abonnements, webhook, échecs de paiement, portail, blocage par forfait) représente plusieurs jours de travail et une route publique de plus à sécuriser.

## Décision
- **Canal principal : la démo**, via un lien de prise de rendez-vous gratuit (Cal.com ou Calendly). Le libre-service reste ouvert en complément.
- **Essai : 10 candidats au total**, sans limite de durée, compté côté serveur au moment d'inviter un candidat.
- **Un seul forfait payant « Agence »**, avec un quota mensuel de candidats (prix et quota : décision commerciale, à valider en démo).
- **Paiement par liens Stripe** (abonnement mensuel), sans code Stripe dans l'application.
- **Activation et désactivation manuelles** du forfait, par un script en ligne de commande versionné (`pnpm plan:set <agence> <forfait>`), inscrit au journal d'audit. Pas d'interface d'administration.

## Options écartées
- **Intégration Stripe complète en v1** : coût et surface de sécurité disproportionnés sans client payant.
- **Offre gratuite permanente (3 candidats/mois, brouillon)** : trop peu pour juger l'outil, jamais assez contraignante pour faire payer, et des comptes qui conservent des données sans jamais payer.
- **Plusieurs forfaits** : plus de choses à maintenir et à tester avant de savoir ce que les agences achètent.

## Conséquences
- Délai d'activation annoncé : « sous 24 h ouvrées ».
- Contrôle mensuel dans Stripe des annulations et échecs de paiement, pour repasser les agences concernées en accès limité.
- **Critère de réexamen** : plus de ~3 paiements en libre-service par mois, **ou** une campagne d'acquisition prévue. On ajoute alors un webhook minimal : paiement réussi = forfait activé ; abonnement annulé = retour à l'accès limité.
