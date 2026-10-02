// Deux lettres pour un avatar : les initiales du nom quand il y en a un, sinon le début
// de l'adresse email.
export function initiales(nom: string | null, email: string): string {
  const mots = (nom ?? "").trim().split(/\s+/).filter(Boolean);
  if (mots.length >= 2) return `${mots[0]![0]}${mots.at(-1)![0]}`.toUpperCase();
  if (mots.length === 1) return mots[0]!.slice(0, 2).toUpperCase();
  return email.slice(0, 2).toUpperCase();
}
