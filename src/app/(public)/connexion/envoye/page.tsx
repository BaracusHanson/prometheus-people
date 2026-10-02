import { MailIcon } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { EcranCentre, TitreEcran } from "@/components/cadres";

export const metadata: Metadata = { title: "Vérifiez votre boîte mail — Prometheus People" };

export default function PageLienEnvoye() {
  return (
    <EcranCentre>
      <span className="flex size-12 items-center justify-center rounded-full bg-bleu-pale text-bleu">
        <MailIcon className="size-6" aria-hidden="true" />
      </span>
      <TitreEcran>Vérifiez votre boîte mail</TitreEcran>
      <p className="leading-relaxed">
        Si l&apos;adresse est valide, un lien de connexion vient de vous être envoyé. Il est valable
        10 minutes et ne sert qu&apos;une seule fois.
      </p>
      <p className="text-sm leading-relaxed text-gris">
        Rien reçu ? Regardez dans vos courriers indésirables, ou{" "}
        <Link href="/connexion" className="font-bold text-bleu underline underline-offset-2">
          recommencez avec une autre adresse
        </Link>
        .
      </p>
    </EcranCentre>
  );
}
