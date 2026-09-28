import { verifierBase } from "@/server/db/health";

// Point de contrôle utilisé après chaque déploiement et par la surveillance de disponibilité.
// Ne renvoie aucune information sensible : l'état, la version déployée et l'état de la base.
// Répond 503 si la base est injoignable, ce qui fait échouer le déploiement.
export const dynamic = "force-dynamic";

export async function GET(): Promise<Response> {
  const database = await verifierBase();
  const ok = database === "ok";

  return Response.json(
    { status: ok ? "ok" : "degraded", version: process.env.APP_VERSION ?? "dev", database },
    { status: ok ? 200 : 503, headers: { "Cache-Control": "no-store" } },
  );
}
