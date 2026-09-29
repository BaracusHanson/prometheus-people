import { z } from "zod";

// Rôle choisi dans le formulaire, et son équivalent Better Auth (ADR-0017).
export const ROLE_BETTER_AUTH = { admin: "admin", recruteur: "member" } as const;

export const invitationSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .pipe(z.email({ error: "Adresse email invalide." }).max(254)),
  role: z.enum(["admin", "recruteur"], { error: "Rôle invalide." }),
});

// Identifiant d'invitation généré par Better Auth (chaîne aléatoire opaque). On en
// vérifie le format avant toute utilisation, notamment dans une URL de redirection.
export const idInvitationSchema = z.string().regex(/^[A-Za-z0-9_-]{1,64}$/);

export function cheminInvitation(id: string): string {
  return `/invitation/${id}`;
}
