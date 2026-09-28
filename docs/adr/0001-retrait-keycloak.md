# ADR-0001 — Retrait de Keycloak / SSO

- **Statut** : Accepté
- **Date** : 2026-09-28

## Contexte
Le brouillon utilisait Keycloak auto-hébergé (via NextAuth) pour l'identité, et Supabase (RLS basée sur `auth.uid()`) pour les données. Les deux ne se comprenaient pas : `auth.uid()` valait toujours NULL, la RLS est devenue inopérante, et la bascule a cassé le journal d'audit, le flux « membre » et le transfert de propriété (audit du 2026-09-28).

Les premiers clients sont de petites agences d'intérim. Aucune n'exige de SSO d'entreprise.

## Décision
Pas de Keycloak ni de SSO en v1. Les recruteurs se connectent par lien magique envoyé par email (voir ADR-0005).

## Options écartées
- **Garder Keycloak** : un service de plus à patcher, sauvegarder et superviser sur un VPS limité, sans demande client.

## Conséquences
- Le VPS n'héberge plus que l'application et le reverse proxy.
- Critère de réexamen : un client ou prospect signé exige du SSO (SAML/OIDC d'entreprise). Better Auth propose un plugin SSO, à évaluer à ce moment-là.
