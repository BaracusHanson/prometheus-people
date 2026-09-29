import { Logo } from "@/components/cadres";
import { LienBouton } from "@/components/ui/bouton";

// Page d'accueil provisoire : le site public complet (maquette validée) arrive dans une
// étape dédiée (ADR-0020).
export default function HomePage() {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="flex items-center justify-between border-b border-trait bg-white px-4 py-4 md:px-16">
        <Logo />
        <LienBouton href="/connexion" variante="secondaire">
          Se connecter
        </LienBouton>
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
          <LienBouton href="/connexion" className="min-h-13 px-6 text-[17px]">
            Essayer avec 10 candidats
          </LienBouton>
        </div>
      </main>
    </div>
  );
}
