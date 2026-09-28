import "server-only";

import { redirect } from "next/navigation";

import { lireSession } from "@/server/auth/session";

import { adhesionsDe } from "./membres";

// LE module d'autorisation (ADR-0007, ADR-0017). Toute lecture ou écriture de données
// d'agence passe par un Contexte construit ici, et nulle part ailleurs.
//
// Règles :
//   - l'agence et le rôle sont RELUS EN BASE à chaque requête (table `member`) ; on ne
//     se fie jamais à l'agence « active » stockée dans la session ;
//   - avoir une session ne donne accès à rien : il faut appartenir à une agence ;
//   - une personne appartient à une seule agence en v1 : plusieurs adhésions = refus.

export type Role = "admin" | "recruteur";

declare const marqueContexte: unique symbol;

// La marque empêche de fabriquer un Contexte ailleurs que dans ce module : un objet
// littéral { userId, orgId, role } n'est pas accepté par les fonctions des queries.ts.
export type Contexte = {
  readonly userId: string;
  readonly orgId: string;
  readonly role: Role;
} & { readonly [marqueContexte]: true };

export class ErreurAutorisation extends Error {
  constructor(message = "Action non autorisée.") {
    super(message);
    this.name = "ErreurAutorisation";
  }
}

export function roleApplicatif(roleBetterAuth: string): Role | null {
  switch (roleBetterAuth) {
    case "owner":
    case "admin":
      return "admin";
    case "member":
      return "recruteur";
    default:
      return null;
  }
}

// Construit le contexte d'un utilisateur à partir de la base. Seul point de création
// d'un Contexte. Utilisé par les pages et actions (via contexteCourant) et par les tests.
export async function contextePourUtilisateur(userId: string): Promise<Contexte | null> {
  const adhesions = await adhesionsDe(userId);
  if (adhesions.length !== 1) return null;

  const [adhesion] = adhesions;
  const role = adhesion ? roleApplicatif(adhesion.role) : null;
  if (!adhesion || !role) return null;

  return Object.freeze({ userId, orgId: adhesion.organizationId, role }) as Contexte;
}

// Contexte de la requête en cours, ou null si la personne n'est pas connectée ou
// n'appartient à aucune agence.
export async function contexteCourant(): Promise<Contexte | null> {
  const session = await lireSession();
  if (!session) return null;
  return contextePourUtilisateur(session.user.id);
}

// Pour les pages de l'espace agence : redirige si la personne n'est pas connectée
// (vers /connexion) ou n'a pas encore d'agence (vers /agence/nouvelle).
export async function exigerContexte(): Promise<Contexte> {
  const session = await lireSession();
  if (!session) redirect("/connexion");

  const contexte = await contextePourUtilisateur(session.user.id);
  if (!contexte) redirect("/agence/nouvelle");

  return contexte;
}

export function exigerAdmin(contexte: Contexte): void {
  if (contexte.role !== "admin") {
    throw new ErreurAutorisation("Réservé aux administrateurs de l'agence.");
  }
}
