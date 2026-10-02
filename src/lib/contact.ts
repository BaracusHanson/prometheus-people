// Adresse publique de l'éditeur : demandes de démo et contact depuis le site. Pas d'outil de
// prise de rendez-vous en v1, le bouton « Réserver une démo » ouvre la messagerie.
export const EMAIL_CONTACT = "contact@prometheus-people.com";

export const LIEN_DEMO = `mailto:${EMAIL_CONTACT}?subject=${encodeURIComponent("Demande de démo")}`;
export const LIEN_CONTACT = `mailto:${EMAIL_CONTACT}`;

// L'éditeur est en franchise de TVA : les prix affichés sont les prix payés.
export const MENTION_TVA = "TVA non applicable, article 293 B du code général des impôts";
