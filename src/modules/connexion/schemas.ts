import { z } from "zod";

import { cheminInvitation, idInvitationSchema } from "@/modules/invitations/schemas";

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
