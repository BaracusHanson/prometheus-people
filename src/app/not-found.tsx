import type { Metadata } from "next";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { CadreVitrine } from "@/components/vitrine/cadre";
import { BOUTON_ACCENT, BOUTON_CONTOUR, TYPO } from "@/components/vitrine/planche";

// Page introuvable (maquette P5), pour toutes les adresses inconnues. Next.js la sert avec
// le code 404 et la balise « noindex ».
export const metadata: Metadata = { title: "Page introuvable · Prometheus People" };

export default function PageIntrouvable() {
  return (
    <CadreVitrine>
      <div className="mx-auto flex w-full max-w-[1312px] flex-1 flex-col items-start justify-center gap-6 px-5 py-16 md:border-x md:border-ligne md:px-12">
        <span
          aria-hidden="true"
          className={`text-[140px] leading-[0.85] text-braise md:text-[200px] ${TYPO.donnee}`}
        >
          404
        </span>
        <h1 className={TYPO.h2}>Cette page n&apos;existe pas.</h1>
        <p className={`max-w-[620px] ${TYPO.corpsL}`}>
          Le lien est peut-être incomplet. Si vous êtes candidat et que votre lien d&apos;invitation
          ne fonctionne pas, contactez l&apos;agence qui vous l&apos;a envoyé.
        </p>
        <div className="flex flex-col gap-3 max-sm:w-full sm:flex-row">
          <Button asChild size="lg" className={BOUTON_ACCENT}>
            <Link href="/">Retour à l&apos;accueil</Link>
          </Button>
          <Button asChild size="lg" className={BOUTON_CONTOUR}>
            <Link href="/connexion">Se connecter</Link>
          </Button>
        </div>
      </div>
    </CadreVitrine>
  );
}
