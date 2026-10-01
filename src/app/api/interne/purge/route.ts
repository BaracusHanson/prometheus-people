import { purgerCandidatsExpires } from "@/modules/purge/queries";
import { contexteSysteme } from "@/server/authz/systeme";

// Purge nocturne (ADR-0023), appelée par le minuteur du serveur depuis l'intérieur du
// conteneur (deploy/purge). Caddy refuse /api/interne/* depuis Internet ; le jeton est
// vérifié ici quand même. La réponse ne contient qu'un nombre.
export const dynamic = "force-dynamic";

export async function POST(requete: Request): Promise<Response> {
  const ctx = contexteSysteme(requete.headers.get("authorization"), "purge");
  if (!ctx) return new Response(null, { status: 404 });

  const supprimes = await purgerCandidatsExpires(ctx);
  return Response.json({ supprimes }, { headers: { "Cache-Control": "no-store" } });
}
