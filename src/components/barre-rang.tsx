import { ZONE_MOYENNE } from "@/modules/questionnaire/libelles";

// Barre de rang commune au rapport du recruteur et au profil du candidat : CSS seul,
// aucune bibliothèque (ADR-0020). Décorative : le rang est toujours écrit à côté.

// Rang sur une ligne de 1 à 99, avec la zone moyenne en bleu pâle.
export function BarreRang({ rang, petite = false }: { rang: number; petite?: boolean }) {
  const taille = petite ? "size-3 -ml-1.5" : "size-3.5 -ml-[7px]";
  return (
    <span aria-hidden="true" className={`relative block ${petite ? "h-3" : "h-3.5"}`}>
      <span
        className="absolute inset-y-0 block bg-bleu-pale"
        style={{
          left: `${ZONE_MOYENNE.debut}%`,
          width: `${ZONE_MOYENNE.fin - ZONE_MOYENNE.debut}%`,
        }}
      />
      <span className="absolute inset-x-0 top-1/2 block h-0.5 -translate-y-1/2 bg-bordure" />
      <span
        className={`absolute top-0 block rounded-full bg-bleu ${taille}`}
        style={{ left: `${rang}%` }}
      />
    </span>
  );
}
