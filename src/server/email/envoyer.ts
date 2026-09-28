import "server-only";

import { getEnv } from "@/server/env";

import type { Email } from "./modeles";

// Envoi d'un email transactionnel (ADR-0016).
//   - Sur le serveur : via l'API Resend (clé limitée à l'envoi, domaine vérifié).
//   - En local, sans clé : l'email est affiché dans le terminal. Aucune clé Resend
//     n'est nécessaire sur le poste de développement.
export async function envoyerEmail(email: Email): Promise<void> {
  const env = getEnv();

  if (!env.RESEND_API_KEY) {
    console.info(
      `\n[email — non envoyé, affichage local]\nÀ : ${email.a}\nObjet : ${email.objet}\n\n${email.texte}\n`,
    );
    return;
  }

  const reponse = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: env.EMAIL_EXPEDITEUR,
      to: [email.a],
      subject: email.objet,
      html: email.html,
      text: email.texte,
    }),
    signal: AbortSignal.timeout(10_000),
  });

  if (!reponse.ok) {
    // Ni la clé ni le contenu de l'email ne sont journalisés.
    throw new Error(`Échec de l'envoi de l'email (Resend a répondu ${reponse.status}).`);
  }
}
