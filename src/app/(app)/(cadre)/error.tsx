"use client";

import { TriangleAlertIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";

// Erreur inattendue dans une page de l'espace agence : la navigation reste utilisable
// et l'utilisateur peut réessayer. Aucun détail technique affiché (les erreurs du serveur sont suivies, ADR-0025).
export default function Erreur({
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  return (
    <Empty className="bg-white">
      <EmptyHeader>
        <EmptyMedia variant="icon" className="bg-ambre-pale text-ambre-texte">
          <TriangleAlertIcon aria-hidden="true" />
        </EmptyMedia>
        <EmptyTitle>Cette page n&apos;a pas pu s&apos;afficher</EmptyTitle>
        <EmptyDescription>
          Un problème est survenu de notre côté. Réessayez ; s&apos;il persiste, écrivez-nous.
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button onClick={() => retry()}>Réessayer</Button>
      </EmptyContent>
    </Empty>
  );
}
