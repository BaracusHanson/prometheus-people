import "server-only";

import { createHash, randomBytes } from "node:crypto";

// Jetons secrets (lien candidat, session candidat — ADR-0021) : 256 bits aléatoires,
// transmis en base64url. Seule leur empreinte SHA-256 est stockée : une fuite de la base
// ne permet pas d'ouvrir un questionnaire.

const FORMAT = /^[A-Za-z0-9_-]{43}$/;

export function genererJeton(): string {
  return randomBytes(32).toString("base64url");
}

export function estFormatJeton(valeur: unknown): valeur is string {
  return typeof valeur === "string" && FORMAT.test(valeur);
}

export function empreinteJeton(jeton: string): string {
  return createHash("sha256").update(jeton).digest("hex");
}
