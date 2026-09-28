// Point de contrôle utilisé après chaque déploiement et par la surveillance de disponibilité.
// Ne renvoie aucune information sensible : seulement l'état et la version déployée.
export const dynamic = "force-dynamic";

export function GET(): Response {
  return Response.json(
    { status: "ok", version: process.env.APP_VERSION ?? "dev" },
    { headers: { "Cache-Control": "no-store" } },
  );
}
