import type { Metadata } from "next";

import { listerMembres, obtenirAgence } from "@/modules/agences/queries";
import { seDeconnecter } from "@/modules/connexion/actions";
import { exigerContexte } from "@/server/authz";

export const metadata: Metadata = { title: "Mon espace — Prometheus People" };

const LIBELLES_ROLE = { admin: "Administrateur", recruteur: "Recruteur" } as const;

// Espace de l'agence : accessible uniquement aux membres d'une agence (ADR-0017).
export default async function PageEspace() {
  const ctx = await exigerContexte();
  const [agence, membres] = await Promise.all([obtenirAgence(ctx), listerMembres(ctx)]);

  return (
    <main>
      <h1>{agence?.nom ?? "Mon agence"}</h1>
      <p>Votre rôle : {LIBELLES_ROLE[ctx.role]}.</p>

      <h2>Membres de l&apos;agence</h2>
      <ul>
        {membres.map((membre) => (
          <li key={membre.email}>
            {membre.email} — {membre.role ? LIBELLES_ROLE[membre.role] : "Rôle inconnu"}
          </li>
        ))}
      </ul>

      <form action={seDeconnecter}>
        <button type="submit">Me déconnecter</button>
      </form>
    </main>
  );
}
