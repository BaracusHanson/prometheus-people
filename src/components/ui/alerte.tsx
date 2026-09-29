import type { ReactNode } from "react";

// Messages : jamais la couleur seule, toujours un texte explicite (ADR-0020).
export type TonAlerte = "info" | "succes" | "attention" | "erreur";

const TONS: Record<TonAlerte, string> = {
  info: "bg-bleu-pale text-bleu-fonce",
  succes: "bg-vert-pale text-vert",
  attention: "bg-ambre-pale text-ambre-texte",
  erreur: "bg-rouge-pale text-rouge",
};

export function Alerte({
  ton = "info",
  children,
  role,
}: {
  ton?: TonAlerte;
  children: ReactNode;
  role?: "alert" | "status";
}) {
  return (
    <div role={role} className={`rounded-controle px-4 py-3 text-sm leading-relaxed ${TONS[ton]}`}>
      {children}
    </div>
  );
}
