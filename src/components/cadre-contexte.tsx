"use client";

import { ChevronsLeftIcon, ChevronsRightIcon, EyeIcon } from "lucide-react";
import { createContext, useContext, useTransition, type ReactNode } from "react";

import { MenuCompte } from "@/components/navigation";
import { basculerApercu } from "@/modules/apercu/actions";

// Ce que le cadre de l'espace recruteur sait et que la barre du haut de chaque page
// affiche : le compte connecté et le mode aperçu (ADR-0029). La barre est rendue par la
// page elle-même (EnTetePage), pour que titre et actions soient dans le HTML du serveur.

interface Cadre {
  compte: string;
  role: string;
  apercu: boolean;
}

const ContexteCadre = createContext<Cadre | null>(null);

export function FournisseurCadre({ valeur, children }: { valeur: Cadre; children: ReactNode }) {
  return <ContexteCadre.Provider value={valeur}>{children}</ContexteCadre.Provider>;
}

// Pastille du mode aperçu (ADR-0027) : ambre, écrite, sur chaque page. Impossible de
// confondre des candidats fictifs avec de vrais candidats.
function PastilleApercu() {
  const [enCours, demarrer] = useTransition();
  return (
    <span
      role="status"
      className="flex items-center gap-2 rounded-full bg-ambre-pale py-1 pr-1 pl-3 text-[13px] text-ambre-fonce"
    >
      <EyeIcon className="size-4 shrink-0" aria-hidden="true" />
      <span>
        <strong>Aperçu</strong>
        <span className="max-lg:sr-only"> : données fictives</span>
      </span>
      <button
        type="button"
        disabled={enCours}
        onClick={() => demarrer(() => basculerApercu(false))}
        className="relative min-h-8 cursor-pointer rounded-full bg-white px-3 text-[13px] font-bold text-ambre-fonce after:absolute after:-inset-1.5 after:content-[''] hover:bg-ambre-pale disabled:opacity-60"
      >
        {enCours ? "Retour…" : "Revenir à mes données"}
      </button>
    </span>
  );
}

// Côté droit de la barre du haut : aperçu et compte (le compte est dans la barre de
// téléphone du cadre, d'où son masquage sous md).
export function ElementsBarre() {
  const cadre = useContext(ContexteCadre);
  if (!cadre) return null;
  return (
    <>
      {cadre.apercu ? <PastilleApercu /> : null}
      <span className="max-md:hidden">
        <MenuCompte compte={cadre.compte} role={cadre.role} cote="bottom" />
      </span>
    </>
  );
}

// Replier ou déplier la colonne de navigation ; le choix est gardé dans un cookie pour
// que le serveur rende directement la bonne largeur (pas de saut à l'affichage).
export function BasculeColonne({ repliee }: { repliee: boolean }) {
  return (
    <button
      type="button"
      onClick={(e) => {
        const colonne = e.currentTarget.closest<HTMLElement>("[data-repliee]");
        if (!colonne) return;
        const suivante = colonne.dataset.repliee !== "true";
        colonne.dataset.repliee = String(suivante);
        e.currentTarget.setAttribute("aria-expanded", String(!suivante));
        document.cookie = `pp_colonne=${suivante ? "repliee" : "ouverte"}; path=/; max-age=31536000; samesite=lax`;
      }}
      aria-expanded={!repliee}
      aria-label="Replier ou déplier la navigation"
      className="flex size-11 cursor-pointer items-center justify-center rounded-controle text-gris hover:bg-ivoire-2 hover:text-encre max-xl:hidden"
    >
      <ChevronsLeftIcon
        className="size-5 group-data-[repliee=true]/colonne:hidden"
        aria-hidden="true"
      />
      <ChevronsRightIcon
        className="hidden size-5 group-data-[repliee=true]/colonne:block"
        aria-hidden="true"
      />
    </button>
  );
}
