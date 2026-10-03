import { ZONE_MOYENNE } from "@/modules/questionnaire/libelles";

// Barre de rang commune au rapport du recruteur et au profil du candidat : CSS seul,
// aucune bibliothèque (ADR-0020). Décorative : le rang est toujours écrit à côté.

// Rang sur une ligne de 1 à 99, avec la zone moyenne en ivoire ; le point est à l'encre :
// une donnée, jamais un jugement (ADR-0028).
export function BarreRang({
  rang,
  petite = false,
  cerclee = false,
  anime,
  accent = false,
  marge,
}: {
  rang: number;
  petite?: boolean;
  // Point cerclé de blanc et d'encre : rapport du recruteur (maquette Retenue). Le profil
  // du candidat garde le point plein de sa maquette (C5).
  cerclee?: boolean;
  // Retard (ms) : le point glisse du 50e rang jusqu'au sien à l'ouverture (anime.css).
  anime?: number;
  // Point de référence (le candidat A d'une comparaison) : braise au lieu d'encre.
  accent?: boolean;
  // Marge d'erreur à 90 % (questionnaire/marges.ts) : un trait plus épais autour du point.
  marge?: { bas: number; haut: number };
}) {
  const taille = petite
    ? "size-3 -ml-1.5"
    : cerclee
      ? "size-[18px] -ml-[9px] -top-0.5 border-[3px] border-white ring-[1.5px] ring-encre"
      : "size-3.5 -ml-[7px]";
  return (
    <span
      aria-hidden="true"
      className={`relative block ${anime !== undefined ? "[container-type:inline-size]" : ""} ${petite ? "h-3" : "h-3.5"}`}
    >
      <span
        className="absolute inset-y-0 block bg-ivoire-2"
        style={{
          left: `${ZONE_MOYENNE.debut}%`,
          width: `${ZONE_MOYENNE.fin - ZONE_MOYENNE.debut}%`,
        }}
      />
      <span className="absolute inset-x-0 top-1/2 block h-0.5 -translate-y-1/2 bg-bordure" />
      {marge ? (
        <span
          className={`absolute top-1/2 block -translate-y-1/2 rounded-full bg-encre/25 ${petite ? "h-1" : "h-1.5"}`}
          style={{ left: `${marge.bas}%`, width: `${marge.haut - marge.bas}%` }}
        />
      ) : null}
      <span
        className={`absolute block rounded-full ${accent ? "bg-braise" : "bg-encre"} ${cerclee && !petite ? "" : "top-0"} ${taille} ${anime !== undefined ? "anime-rang" : ""}`}
        style={{
          left: `${rang}%`,
          ...(anime !== undefined ? { "--rang": rang, "--retard": `${anime}ms` } : {}),
        }}
      />
    </span>
  );
}
