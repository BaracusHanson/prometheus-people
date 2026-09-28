import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Vérifiez votre boîte mail — Prometheus People" };

export default function PageLienEnvoye() {
  return (
    <main>
      <h1>Vérifiez votre boîte mail</h1>
      <p>
        Si l&apos;adresse est valide, un lien de connexion vient de vous être envoyé. Il est valable
        10 minutes et ne sert qu&apos;une seule fois.
      </p>
      <p>Pensez à regarder dans vos courriers indésirables.</p>
      <p>
        <Link href="/connexion">Recommencer avec une autre adresse</Link>
      </p>
    </main>
  );
}
