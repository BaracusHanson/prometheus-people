// Adresse publique de l'éditeur : demandes de démo et contact depuis le site. Pas d'outil de
// prise de rendez-vous en v1, le bouton « Réserver une démo » ouvre la messagerie.
export const EMAIL_CONTACT = "contact@prometheus-people.com";

export const LIEN_DEMO = `mailto:${EMAIL_CONTACT}?subject=${encodeURIComponent("Demande de démo")}`;
export const LIEN_CONTACT = `mailto:${EMAIL_CONTACT}`;
