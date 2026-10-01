import { z } from "zod";

import { cheminInvitation, idInvitationSchema } from "@/modules/invitations/schemas";
import { LONGUEUR_MAX_MOT_DE_PASSE, LONGUEUR_MIN_MOT_DE_PASSE } from "@/server/auth/options";

export const demandeLienSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .pipe(z.email({ error: "Adresse email invalide." }).max(254)),
});

// Page où revenir après la connexion. Seul le lien d'une invitation est accepté :
// une adresse libre permettrait de rediriger vers un autre site (redirection ouverte).
export function cheminDeSuite(valeur: unknown): string | null {
  if (typeof valeur !== "string") return null;
  const [, id] = /^\/invitation\/([^/?#]+)$/.exec(valeur) ?? [];
  return id && idInvitationSchema.safeParse(id).success ? cheminInvitation(id) : null;
}

// Choix ou changement du mot de passe (ADR-0026). L'actuel n'est exigé que s'il existe.
export const changementMotDePasseSchema = z
  .object({
    actuel: z.string().optional(),
    nouveau: z
      .string()
      .min(LONGUEUR_MIN_MOT_DE_PASSE, {
        error: `Le mot de passe doit faire au moins ${LONGUEUR_MIN_MOT_DE_PASSE} caractères.`,
      })
      .max(LONGUEUR_MAX_MOT_DE_PASSE, {
        error: `Le mot de passe doit faire au plus ${LONGUEUR_MAX_MOT_DE_PASSE} caractères.`,
      }),
    confirmation: z.string(),
  })
  .refine((d) => d.nouveau === d.confirmation, {
    path: ["confirmation"],
    error: "Les deux mots de passe ne sont pas identiques.",
  });
