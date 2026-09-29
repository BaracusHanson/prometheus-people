import Link from "next/link";
import type { ButtonHTMLAttributes, ComponentProps } from "react";

// Boutons (ADR-0020) : une action principale en bleu, une secondaire en contour,
// une discrète sans fond, et « danger » réservé aux suppressions.
export type VarianteBouton = "principal" | "secondaire" | "discret" | "danger";

const BASE =
  "inline-flex min-h-11 items-center justify-center gap-2 rounded-controle px-4 text-[15px] font-bold " +
  "transition-colors disabled:cursor-not-allowed disabled:opacity-60";

const VARIANTES: Record<VarianteBouton, string> = {
  principal: "bg-bleu text-white hover:bg-bleu-fonce",
  secondaire: "border-[1.5px] border-bleu bg-white text-bleu hover:bg-bleu-pale",
  discret: "px-2 text-bleu hover:bg-bleu-pale",
  danger: "border-[1.5px] border-rouge bg-white text-rouge hover:bg-rouge-pale",
};

export function classesBouton(variante: VarianteBouton = "principal", extra = ""): string {
  return `${BASE} ${VARIANTES[variante]} ${extra}`.trim();
}

export function Bouton({
  variante = "principal",
  className = "",
  type = "button",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variante?: VarianteBouton }) {
  return <button type={type} className={classesBouton(variante, className)} {...props} />;
}

export function LienBouton({
  variante = "principal",
  className = "",
  ...props
}: ComponentProps<typeof Link> & { variante?: VarianteBouton }) {
  return <Link className={classesBouton(variante, className)} {...props} />;
}
