import type { HTMLAttributes, ReactNode } from "react";

// Trame du site public : la page est une planche de mesures. Une colonne centrale bordée de
// deux filets verticaux, chaque section ouverte par un filet horizontal marqué de deux
// croix de repère. Échelle typographique et classes partagées (ADR-0020, ADR-0028).

export const TYPO = {
  display:
    "text-[54px] leading-[0.9] font-extrabold font-stretch-[62%] tracking-[-0.02em] text-balance md:text-[88px] xl:text-[104px]",
  h2: "text-[40px] leading-[0.95] font-extrabold font-stretch-[66%] tracking-[-0.015em] text-balance md:text-[60px]",
  h3: "text-[24px] leading-tight font-extrabold font-stretch-[78%] md:text-[28px]",
  corpsL: "text-lg leading-relaxed md:text-xl",
  legende: "text-[12px] font-bold tracking-[0.1em] uppercase",
  donnee: "chiffres font-extrabold font-stretch-[66%]",
} as const;

export const BOUTON_ACCENT =
  "bg-braise font-extrabold text-white hover:bg-braise-fonce focus-visible:ring-braise/40";
export const BOUTON_CONTOUR =
  "border-[1.5px] border-encre bg-transparent font-bold text-encre hover:bg-ivoire-2";

function Croix({ cote, sombre }: { cote: "gauche" | "droite"; sombre: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={`absolute -top-[5px] block size-[9px] max-md:hidden ${
        cote === "gauche" ? "-left-[5px]" : "-right-[5px]"
      } before:absolute before:top-1/2 before:left-0 before:block before:h-px before:w-full after:absolute after:top-0 after:left-1/2 after:block after:h-full after:w-px ${
        sombre ? "before:bg-gris-clair after:bg-gris-clair" : "before:bg-encre after:bg-encre"
      }`}
    />
  );
}

export function Planche({
  children,
  sombre = false,
  bandeau = false,
  className = "",
  interieur = "py-20 md:py-28",
  ...props
}: {
  children: ReactNode;
  sombre?: boolean;
  bandeau?: boolean;
  className?: string;
  interieur?: string;
} & HTMLAttributes<HTMLElement>) {
  const fond = sombre ? "bg-encre text-white" : bandeau ? "bg-ivoire-2" : "";
  const filet = sombre ? "border-encre-2" : "border-ligne";
  return (
    <section {...props} className={`border-t ${filet} ${fond} ${className}`}>
      <div
        className={`relative mx-auto max-w-[1312px] px-5 md:border-x md:px-12 ${filet} ${interieur}`}
      >
        <Croix cote="gauche" sombre={sombre} />
        <Croix cote="droite" sombre={sombre} />
        {children}
      </div>
    </section>
  );
}

// En-tête de chapitre : numéro, surtitre, titre en deux tons (affirmation + suite en gris).
export function EnTeteChapitre({
  numero,
  surtitre,
  id,
  titre,
  suite,
  sombre = false,
  className = "",
}: {
  numero?: string;
  surtitre: string;
  id?: string;
  titre: ReactNode;
  suite?: ReactNode;
  sombre?: boolean;
  className?: string;
}) {
  return (
    <div className={`flex max-w-[920px] flex-col gap-6 ${className}`}>
      <p className={`flex items-center gap-3 ${TYPO.legende}`}>
        {numero && (
          <span className={`chiffres ${sombre ? "text-braise-pale" : "text-braise"}`}>
            {numero}
          </span>
        )}
        {numero && (
          <span
            aria-hidden="true"
            className={`block h-px w-8 ${sombre ? "bg-encre-2" : "bg-ligne"}`}
          />
        )}
        <span className={sombre ? "text-gris-clair" : "text-gris"}>{surtitre}</span>
      </p>
      <h2 id={id} className={`scroll-mt-28 ${TYPO.h2}`}>
        {titre}
        {suite && (
          <>
            {" "}
            <span className={sombre ? "text-gris-clair" : "text-gris"}>{suite}</span>
          </>
        )}
      </h2>
    </div>
  );
}

// Légende de figure, à la manière d'une planche scientifique.
export function Legende({
  numero,
  children,
  sombre = false,
}: {
  numero: string;
  children: ReactNode;
  sombre?: boolean;
}) {
  return (
    <figcaption
      className={`flex items-baseline gap-3 text-[13px] ${sombre ? "text-gris-clair" : "text-gris"}`}
    >
      <span className={`chiffres shrink-0 ${TYPO.legende} ${sombre ? "text-white" : "text-encre"}`}>
        Fig. {numero}
      </span>
      <span>{children}</span>
    </figcaption>
  );
}
