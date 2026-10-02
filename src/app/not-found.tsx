import type { Metadata } from "next";
import Link from "next/link";

import { EnTeteSite } from "@/components/cadres";
import { Button } from "@/components/ui/button";

// Page introuvable (maquette P5), pour toutes les adresses inconnues. Next.js la sert avec
// le code 404 et la balise « noindex ».
export const metadata: Metadata = { title: "Page introuvable · Prometheus People" };

export default function PageIntrouvable() {
  return (
    <div className="flex min-h-dvh flex-col">
      <EnTeteSite />
      <main className="flex flex-1 flex-col items-start justify-center gap-5 px-4 py-12 md:px-8 xl:px-16">
        <span
          aria-hidden="true"
          className="text-[120px] leading-[0.9] font-extrabold font-stretch-[62%] text-bleu md:text-[160px]"
        >
          404
        </span>
        <h1 className="text-[34px] leading-tight font-extrabold font-stretch-[72%] md:text-[44px]">
          Cette page n&apos;existe pas.
        </h1>
        <p className="max-w-[620px] text-lg leading-normal md:text-[19px]">
          Le lien est peut-être incomplet. Si vous êtes candidat et que votre lien d&apos;invitation
          ne fonctionne pas, contactez l&apos;agence qui vous l&apos;a envoyé.
        </p>
        <div className="flex flex-col gap-3 max-sm:w-full sm:flex-row">
          <Button asChild size="lg" className="font-extrabold">
            <Link href="/">Retour à l&apos;accueil</Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/connexion">Se connecter</Link>
          </Button>
        </div>
      </main>
    </div>
  );
}
