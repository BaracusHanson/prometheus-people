"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { getEnv } from "@/server/env";
import { contexteCourant } from "@/server/authz";

import { COOKIE_APERCU } from "./etat";

// Active ou coupe le mode aperçu (ADR-0027). L'activer est réservé aux administrateurs
// (le réglage est dans Paramètres) ; le couper est permis à tout membre, depuis le
// bandeau. Le cookie ne donne accès à rien : il remplace l'affichage par des données
// fictives et masque les vraies.
export async function basculerApercu(actif: boolean): Promise<void> {
  const ctx = await contexteCourant();
  if (!ctx) redirect("/connexion");

  const jar = await cookies();
  if (actif && ctx.role === "admin") {
    jar.set(COOKIE_APERCU, "1", {
      httpOnly: true,
      secure: getEnv().NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 8 * 60 * 60,
    });
  } else {
    jar.delete(COOKIE_APERCU);
  }
  revalidatePath("/", "layout");
}
