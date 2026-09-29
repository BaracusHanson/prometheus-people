import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from "react";

// Champ de formulaire avec son libellé visible, son aide et son erreur reliés au champ
// (aria-describedby) : un lecteur d'écran lit l'erreur en même temps que le libellé.

const CONTROLE =
  "min-h-11 w-full rounded-controle border bg-white px-3 text-base text-encre " +
  "aria-[invalid=true]:border-2 aria-[invalid=true]:border-rouge";

interface Commun {
  id: string;
  libelle: ReactNode;
  aide?: ReactNode;
  erreur?: string;
}

function descriptions({ id, aide, erreur }: Commun): string | undefined {
  const ids = [aide ? `${id}-aide` : null, erreur ? `${id}-erreur` : null].filter(Boolean);
  return ids.length > 0 ? ids.join(" ") : undefined;
}

function Cadre({ id, libelle, aide, erreur, children }: Commun & { children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className="text-sm font-bold">
        {libelle}
      </label>
      {children}
      {aide && (
        <p id={`${id}-aide`} className="text-[13px] text-gris">
          {aide}
        </p>
      )}
      {erreur && (
        <p id={`${id}-erreur`} role="alert" className="text-[13px] font-bold text-rouge">
          {erreur}
        </p>
      )}
    </div>
  );
}

export function Champ({
  id,
  libelle,
  aide,
  erreur,
  className = "",
  ...props
}: Commun & Omit<InputHTMLAttributes<HTMLInputElement>, "id">) {
  return (
    <Cadre id={id} libelle={libelle} aide={aide} erreur={erreur}>
      <input
        id={id}
        aria-invalid={erreur ? true : undefined}
        aria-describedby={descriptions({ id, libelle, aide, erreur })}
        className={`${CONTROLE} border-champ ${className}`}
        {...props}
      />
    </Cadre>
  );
}

export function ChampListe({
  id,
  libelle,
  aide,
  erreur,
  className = "",
  children,
  ...props
}: Commun & Omit<SelectHTMLAttributes<HTMLSelectElement>, "id">) {
  return (
    <Cadre id={id} libelle={libelle} aide={aide} erreur={erreur}>
      <select
        id={id}
        aria-invalid={erreur ? true : undefined}
        aria-describedby={descriptions({ id, libelle, aide, erreur })}
        className={`${CONTROLE} border-champ ${className}`}
        {...props}
      >
        {children}
      </select>
    </Cadre>
  );
}
