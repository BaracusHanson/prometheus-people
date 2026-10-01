import { changerForfait } from "@/modules/candidats/queries";
import { contexteSysteme } from "@/server/authz/systeme";

// Activation d'un forfait (ADR-0011), appelée par deploy/forfait/forfait.sh depuis
// l'intérieur du conteneur. Caddy refuse /api/interne/* depuis Internet ; le jeton propre
// à cette tâche est vérifié ici quand même.
export const dynamic = "force-dynamic";

export async function POST(requete: Request): Promise<Response> {
  const ctx = contexteSysteme(requete.headers.get("authorization"), "forfait");
  if (!ctx) return new Response(null, { status: 404 });

  let corps: { email?: unknown; forfait?: unknown } = {};
  try {
    corps = (await requete.json()) as typeof corps;
  } catch {
    // Corps illisible : traité comme une demande incomplète ci-dessous.
  }

  const resultat = await changerForfait(ctx, corps.email, corps.forfait);
  return Response.json(resultat, {
    status: resultat.ok ? 200 : 422,
    headers: { "Cache-Control": "no-store" },
  });
}
