import type { Metadata } from "next";

import { PageLegale } from "@/components/page-legale";
import { TEXTES_LEGAUX } from "@/modules/site/textes-legaux";

const texte = TEXTES_LEGAUX["mentions-legales"];

export const metadata: Metadata = {
  title: `${texte.titre} · Prometheus People`,
  description: texte.description,
};

export default function Page() {
  return <PageLegale texte={texte} />;
}
