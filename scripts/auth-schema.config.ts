// Configuration utilisée UNIQUEMENT pour générer le schéma des tables Better Auth :
//   pnpm auth:schema
// Les dépendances sont factices : seule la liste des modules compte pour le schéma.
// L'application utilise la même fonction creerOptionsAuth (src/server/auth/index.ts).
import { betterAuth } from "better-auth";

import { creerOptionsAuth } from "../src/server/auth/options";

export const auth = betterAuth(
  creerOptionsAuth({
    db: {},
    baseURL: "http://localhost:3000",
    secret: "generation-du-schema-uniquement-aucun-usage-reel",
    secureCookies: false,
    envoyerLienMagique: () => Promise.resolve(),
    estMembreDUneAgence: () => Promise.resolve(false),
  }),
);
