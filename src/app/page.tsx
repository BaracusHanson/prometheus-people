import Link from "next/link";

export default function HomePage() {
  return (
    <main>
      <h1>Prometheus People</h1>
      <p>Évaluation de personnalité pour le recrutement en agence d&apos;intérim.</p>
      <p>
        <Link href="/connexion">Se connecter</Link>
      </p>
    </main>
  );
}
