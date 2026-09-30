import { z } from "zod";

// Durées de conservation proposées (maquette « Paramètres ») ; 24 mois par défaut
// (ADR-0010). La base refuse toute autre valeur.
export const DUREES_CONSERVATION = [24, 12, 6] as const;
export type DureeConservation = (typeof DUREES_CONSERVATION)[number];
export const CONSERVATION_PAR_DEFAUT: DureeConservation = 24;

export const conservationSchema = z.coerce
  .number()
  .refine((n): n is DureeConservation => (DUREES_CONSERVATION as readonly number[]).includes(n), {
    message: "Durée non proposée.",
  });

// Adresse de contact RGPD de l'agence : vide = aucune (on l'efface).
export const emailContactSchema = z
  .string()
  .trim()
  .toLowerCase()
  .max(254)
  .pipe(z.union([z.literal(""), z.email({ error: "Adresse email invalide." })]))
  .transform((v) => (v === "" ? null : v));
