import { ZONE_MOYENNE } from "@/modules/questionnaire/libelles";
import { ordinal } from "@/modules/questionnaire/ordinal";
import type { PointEcart } from "@/modules/questionnaire/points";

// Écart dessiné d'un sujet à explorer (document « Fiche recruteur », partie 8) : deux
// points reliés sur la même piste de 1 à 99. Il répond à « de combien, dans quel sens ? »
// sans chiffre d'écart ni pourcentage. CSS seul, aucune bibliothèque (ADR-0020).
// La sous-dimension signalée est un point plein braise, la comparaison un point creux à
// l'encre : la forme distingue les deux, pas seulement la couleur.

function Pastille({ signale, grande = false }: { signale: boolean; grande?: boolean }) {
  const taille = grande ? "size-3.5" : "size-2.5";
  return (
    <span
      aria-hidden="true"
      className={`inline-block shrink-0 rounded-full ${taille} ${
        signale ? "bg-braise" : "border-2 border-encre bg-white"
      }`}
    />
  );
}

function Etiquette({ point, fin = false }: { point: PointEcart; fin?: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={`flex items-center gap-1.5 text-[13px] leading-tight text-gris-fonce ${fin ? "justify-end text-right" : ""}`}
    >
      <Pastille signale={point.signale} />
      {point.libelle}
    </span>
  );
}

export function EcartDessine({ points }: { points: readonly [PointEcart, PointEcart] }) {
  const [bas, haut] = points[0].rang <= points[1].rang ? points : [points[1], points[0]];
  return (
    <figure className="flex flex-col gap-1.5">
      <figcaption className="sr-only">
        {points.map((p) => `${p.libelle} : ${ordinal(p.rang)} rang`).join(" ; ")}.
      </figcaption>
      <Etiquette point={haut} fin />
      <span aria-hidden="true" className="relative mx-[7px] block h-3.5">
        <span
          className="absolute inset-y-0 block bg-ivoire-2"
          style={{
            left: `${ZONE_MOYENNE.debut}%`,
            width: `${ZONE_MOYENNE.fin - ZONE_MOYENNE.debut}%`,
          }}
        />
        <span className="absolute inset-x-0 top-1/2 block h-0.5 -translate-y-1/2 bg-bordure" />
        <span
          className="absolute top-1/2 block h-0.5 -translate-y-1/2 bg-braise"
          style={{ left: `${bas.rang}%`, width: `${haut.rang - bas.rang}%` }}
        />
        {[bas, haut].map((p) => (
          <span
            key={p.libelle}
            className="absolute top-0 -ml-[7px] flex"
            style={{ left: `${p.rang}%` }}
          >
            <Pastille signale={p.signale} grande />
          </span>
        ))}
      </span>
      <Etiquette point={bas} />
    </figure>
  );
}
