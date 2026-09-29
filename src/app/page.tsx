import Link from "next/link";

import { Logo } from "@/components/cadres";
import { Button } from "@/components/ui/button";

// Page d'accueil provisoire : le site public complet (maquette validée) arrive dans une
// étape dédiée (ADR-0020).
export default function HomePage() {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="flex items-center justify-between border-b border-trait bg-white px-4 py-4 md:px-16">
        <Logo />
        <Button asChild variant="outline">
          <Link href="/connexion">Se connecter</Link>
        </Button>
      </header>
      <main className="flex flex-1 flex-col justify-center gap-6 bg-white px-4 py-16 md:px-16">
        <h1 className="max-w-4xl text-5xl leading-[0.98] font-extrabold font-stretch-[68%] text-balance md:text-7xl">
          Recrutez vos intérimaires sur autre chose qu&apos;une intuition.
        </h1>
        <p className="max-w-2xl text-lg leading-relaxed md:text-xl">
          Un questionnaire de personnalité de 15 minutes, passé sur téléphone. Pour vous, un profil
          clair et des questions d&apos;entretien prêtes à poser.
        </p>
        <div>
          <Button asChild size="lg">
            <Link href="/connexion">Essayer avec 10 candidats</Link>
          </Button>
        </div>
      </main>
    </div>
  );
}
