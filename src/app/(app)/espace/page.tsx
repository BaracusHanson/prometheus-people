import type { Metadata } from "next";

import { seDeconnecter } from "@/modules/connexion/actions";
import { exigerSession } from "@/server/auth/session";

export const metadata: Metadata = { title: "Mon espace — Prometheus People" };

// Espace connecté, volontairement minimal : l'agence et les données arrivent en PR 5b.
export default async function PageEspace() {
  const session = await exigerSession();

  return (
    <main>
      <h1>Mon espace</h1>
      <p>Connecté en tant que {session.user.email}.</p>
      <form action={seDeconnecter}>
        <button type="submit">Me déconnecter</button>
      </form>
    </main>
  );
}
