import { z } from "zod";

export const nomAgenceSchema = z.object({
  nom: z
    .string()
    .trim()
    .min(2, "Le nom doit faire au moins 2 caractères.")
    .max(80, "Le nom doit faire au plus 80 caractères."),
});

// Identifiant lisible et unique d'une agence (exigé par Better Auth). Il n'est jamais
// utilisé pour l'autorisation : l'agence d'une personne est lue dans la table `member`.
export function creerSlug(nom: string, suffixe: string): string {
  const base = nom
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // retire les accents décomposés par NFD
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
  return `${base || "agence"}-${suffixe}`;
}
