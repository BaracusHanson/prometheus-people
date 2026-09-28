import { toNextJsHandler } from "better-auth/next-js";

import { getAuth } from "@/server/auth";

// Points d'entrée de Better Auth (/api/auth/*) : demande et vérification des liens
// magiques, déconnexion, session. L'instance est créée au premier appel.
export const dynamic = "force-dynamic";

export function GET(request: Request): Promise<Response> {
  return toNextJsHandler(getAuth()).GET(request);
}

export function POST(request: Request): Promise<Response> {
  return toNextJsHandler(getAuth()).POST(request);
}
