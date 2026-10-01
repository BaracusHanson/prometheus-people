import { Skeleton } from "@/components/ui/skeleton";

// Chargement d'une page de l'espace agence : la navigation reste en place, seul le
// contenu attend. Annoncé une fois aux lecteurs d'écran.
export default function Chargement() {
  return (
    <div className="flex flex-col gap-6" aria-busy="true">
      <p role="status" className="sr-only">
        Chargement…
      </p>
      <div className="flex items-end justify-between gap-4">
        <Skeleton className="h-9 w-64" />
        <Skeleton className="h-11 w-48" />
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-24 rounded-bloc" />
        ))}
      </div>
      <div className="grid gap-5 lg:grid-cols-2">
        <Skeleton className="h-72 rounded-bloc" />
        <Skeleton className="h-72 rounded-bloc" />
      </div>
    </div>
  );
}
