// « 1er », « 2e », « 58e » : module sans dépendance, utilisable côté navigateur.
export function ordinal(rang: number): string {
  return rang === 1 ? "1er" : `${rang}e`;
}
