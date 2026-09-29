// Modèles d'emails : fonctions pures, sans accès réseau, testées unitairement.
// Toute valeur insérée dans le HTML est échappée : un nom ou une adresse saisis
// par quelqu'un ne peuvent jamais injecter de HTML dans un email.

export interface Email {
  a: string;
  objet: string;
  texte: string;
  html: string;
}

export function echapperHtml(valeur: string): string {
  return valeur
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function emailLienMagique(a: string, url: string, dureeMinutes: number): Email {
  const texte = [
    "Bonjour,",
    "",
    "Voici votre lien de connexion à Prometheus People :",
    url,
    "",
    `Ce lien est valable ${dureeMinutes} minutes et ne peut servir qu'une seule fois.`,
    "Si vous n'avez pas demandé à vous connecter, ignorez simplement cet email.",
  ].join("\n");

  const html = `<!doctype html>
<html lang="fr">
  <body style="font-family: system-ui, sans-serif; color: #1f2937; line-height: 1.5;">
    <p>Bonjour,</p>
    <p>Voici votre lien de connexion à Prometheus People :</p>
    <p><a href="${echapperHtml(url)}" style="display: inline-block; padding: 10px 16px; background: #1f2937; color: #ffffff; text-decoration: none; border-radius: 6px;">Me connecter</a></p>
    <p style="font-size: 14px; color: #4b5563;">Ce lien est valable ${dureeMinutes} minutes et ne peut servir qu'une seule fois.<br>
    Si vous n'avez pas demandé à vous connecter, ignorez simplement cet email.</p>
  </body>
</html>`;

  return { a, objet: "Votre lien de connexion à Prometheus People", texte, html };
}

const ROLES_INVITATION: Record<string, string> = {
  admin: "en tant qu'administrateur",
  member: "en tant que recruteur",
};

export function emailInvitation(
  a: string,
  invitation: { url: string; agence: string; role: string; dureeJours: number },
): Email {
  const role = ROLES_INVITATION[invitation.role] ?? ROLES_INVITATION.member;
  const { url, agence, dureeJours } = invitation;

  const texte = [
    "Bonjour,",
    "",
    `Vous êtes invité à rejoindre l'agence « ${agence} » sur Prometheus People, ${role}.`,
    "Pour accepter, ouvrez ce lien puis connectez-vous avec cette adresse email :",
    url,
    "",
    `Cette invitation est valable ${dureeJours} jours.`,
    "Si vous ne connaissez pas cette agence, ignorez simplement cet email.",
  ].join("\n");

  const html = `<!doctype html>
<html lang="fr">
  <body style="font-family: system-ui, sans-serif; color: #1f2937; line-height: 1.5;">
    <p>Bonjour,</p>
    <p>Vous êtes invité à rejoindre l'agence « ${echapperHtml(agence)} » sur Prometheus People, ${role}.</p>
    <p>Pour accepter, ouvrez ce lien puis connectez-vous avec cette adresse email :</p>
    <p><a href="${echapperHtml(url)}" style="display: inline-block; padding: 10px 16px; background: #1f2937; color: #ffffff; text-decoration: none; border-radius: 6px;">Voir l'invitation</a></p>
    <p style="font-size: 14px; color: #4b5563;">Cette invitation est valable ${dureeJours} jours.<br>
    Si vous ne connaissez pas cette agence, ignorez simplement cet email.</p>
  </body>
</html>`;

  // Le nom de l'agence est saisi par un client : il ne va pas dans l'objet, pour
  // qu'une agence ne puisse pas écrire le titre d'un email envoyé en notre nom.
  return { a, objet: "Invitation à rejoindre une agence sur Prometheus People", texte, html };
}

const formatDateLongue = new Intl.DateTimeFormat("fr-FR", {
  dateStyle: "long",
  timeZone: "Europe/Paris",
});

export function emailInvitationCandidat(
  a: string,
  invitation: { nom: string; agence: string; poste: string; url: string; expireLe: Date },
): Email {
  const { nom, agence, poste, url } = invitation;
  const limite = formatDateLongue.format(invitation.expireLe);

  const texte = [
    `Bonjour ${nom},`,
    "",
    `L'agence « ${agence} » vous propose un questionnaire de personnalité avant votre entretien pour le poste de ${poste.toLowerCase()}.`,
    "Comptez 15 à 20 minutes, sur votre téléphone ou votre ordinateur. Il n'y a pas de bonne ou de mauvaise réponse, et vous verrez votre profil à la fin.",
    "",
    "Pour commencer, ouvrez ce lien personnel :",
    url,
    "",
    `Ce lien est valable jusqu'au ${limite}. Il ne fonctionne qu'une fois : vous pourrez ensuite faire une pause et reprendre sur le même appareil.`,
    "Ne le transférez à personne.",
  ].join("\n");

  const html = `<!doctype html>
<html lang="fr">
  <body style="font-family: system-ui, sans-serif; color: #1b2230; line-height: 1.5;">
    <p>Bonjour ${echapperHtml(nom)},</p>
    <p>L'agence « ${echapperHtml(agence)} » vous propose un questionnaire de personnalité avant votre entretien pour le poste de ${echapperHtml(poste.toLowerCase())}.</p>
    <p>Comptez 15 à 20 minutes, sur votre téléphone ou votre ordinateur. Il n'y a pas de bonne ou de mauvaise réponse, et vous verrez votre profil à la fin.</p>
    <p><a href="${echapperHtml(url)}" style="display: inline-block; padding: 12px 20px; background: #2344a8; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 700;">Commencer le questionnaire</a></p>
    <p style="font-size: 14px; color: #505a6b;">Ce lien est valable jusqu'au ${limite}. Il ne fonctionne qu'une fois : vous pourrez ensuite faire une pause et reprendre sur le même appareil. Ne le transférez à personne.</p>
  </body>
</html>`;

  // Objet fixe : le nom de l'agence, saisi par un client, n'écrit pas le titre (ADR-0021).
  return { a, objet: "Votre questionnaire avant l'entretien", texte, html };
}
