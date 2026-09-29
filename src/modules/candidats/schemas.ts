import { z } from "zod";

// Types de poste : liste fixe en v1 (ADR-0010). La clé est stockée, le libellé affiché.
export const TYPES_POSTE = {
  "preparateur-commandes": "Préparateur de commandes",
  cariste: "Cariste",
  "agent-accueil": "Agent d'accueil",
  "aide-soignant": "Aide-soignant",
  "agent-production": "Agent de production",
} as const;

export type TypePoste = keyof typeof TYPES_POSTE;

const CLES_POSTE = Object.keys(TYPES_POSTE) as [TypePoste, ...TypePoste[]];

export const invitationCandidatSchema = z.object({
  nom: z
    .string()
    .trim()
    .min(2, "Le nom doit faire au moins 2 caractères.")
    .max(100, "Le nom doit faire au plus 100 caractères."),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .pipe(z.email({ error: "Adresse email invalide." }).max(254)),
  typePoste: z.enum(CLES_POSTE, { error: "Choisissez un type de poste." }),
});

export type InvitationCandidat = z.infer<typeof invitationCandidatSchema>;

export const idCandidatSchema = z.uuid();
