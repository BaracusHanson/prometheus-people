// Lien inconnu, expiré, révoqué ou déjà utilisé : même page, sans rien révéler (ADR-0021).
export default function PageLienInvalide() {
  return (
    <div className="flex flex-col items-center gap-4 pt-10 text-center">
      <span className="flex size-16 items-center justify-center rounded-full bg-ambre-pale text-ambre-texte">
        <svg
          width="32"
          height="32"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v5l3 2" />
        </svg>
      </span>
      <h1 className="text-3xl leading-tight font-extrabold font-stretch-[80%]">
        Ce lien n&apos;est plus valable
      </h1>
      <p className="text-base leading-relaxed">
        Il a expiré, a déjà servi, ou il est incomplet. Pour votre sécurité, chaque lien ne
        fonctionne qu&apos;une fois et pendant 7 jours.
      </p>
      <div className="w-full rounded-bloc border border-bordure bg-white p-4 text-left">
        <p className="font-extrabold">Que faire ?</p>
        <p className="mt-1 leading-relaxed">
          Contactez l&apos;agence qui vous a envoyé l&apos;invitation : elle peut vous en renvoyer
          une nouvelle en un clic.
        </p>
      </div>
      <p className="text-sm leading-relaxed text-gris">
        Si vous aviez déjà terminé le questionnaire, vos réponses sont bien enregistrées : vous
        n&apos;avez rien à refaire.
      </p>
    </div>
  );
}
