import { z } from "zod";

export const demandeLienSchema = z.object({
  email: z
    .string()
    .trim()
    .toLowerCase()
    .pipe(z.email({ error: "Adresse email invalide." }).max(254)),
});
