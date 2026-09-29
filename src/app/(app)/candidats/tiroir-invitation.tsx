"use client";

import { useActionState, useEffect, useRef, useState } from "react";

import { Alerte } from "@/components/ui/alerte";
import { Bouton } from "@/components/ui/bouton";
import { Champ, ChampListe } from "@/components/ui/champ";
import { inviterCandidat, type EtatInvitationCandidat } from "@/modules/candidats/actions";
import { TYPES_POSTE } from "@/modules/candidats/schemas";

const ETAT_INITIAL: EtatInvitationCandidat = {};

// Tiroir « Inviter un candidat » (maquette, page Candidats). Élément <dialog> natif :
// focus piégé, fermeture par Échap et retour du focus gérés par le navigateur.
export function TiroirInvitation({ restantes, limite }: { restantes: number; limite: number }) {
  const dialogue = useRef<HTMLDialogElement>(null);
  const formulaire = useRef<HTMLFormElement>(null);
  const [cle, setCle] = useState(0);
  const [etat, action, enCours] = useActionState(inviterCandidat, ETAT_INITIAL);

  // Après un envoi réussi, le formulaire est vidé pour l'invitation suivante.
  useEffect(() => {
    if (etat.succes) formulaire.current?.reset();
  }, [etat]);

  return (
    <>
      <Bouton onClick={() => dialogue.current?.showModal()} disabled={restantes === 0}>
        <svg
          width="16"
          height="16"
          viewBox="0 0 18 18"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          aria-hidden="true"
        >
          <path d="M9 3v12M3 9h12" />
        </svg>
        Inviter un candidat
      </Bouton>
      <dialog
        ref={dialogue}
        aria-labelledby="titre-invitation"
        onClose={() => setCle((c) => c + 1)}
        className="m-0 ml-auto h-dvh max-h-none w-full max-w-[460px] bg-white p-0 text-encre backdrop:bg-encre/45"
      >
        <div key={cle} className="flex h-full flex-col gap-4 p-6">
          <div className="flex items-center justify-between">
            <h2 id="titre-invitation" className="text-2xl font-extrabold font-stretch-[85%]">
              Inviter un candidat
            </h2>
            <Bouton
              variante="discret"
              aria-label="Fermer"
              onClick={() => dialogue.current?.close()}
            >
              <span aria-hidden="true" className="text-xl">
                ×
              </span>
            </Bouton>
          </div>
          <p className="text-sm leading-relaxed text-gris">
            Le candidat reçoit un lien personnel, valable 7 jours et utilisable une seule fois. Il
            n&apos;a pas besoin de créer de compte.
          </p>
          <form ref={formulaire} action={action} className="flex flex-1 flex-col gap-4">
            <Champ
              id="nom"
              name="nom"
              libelle="Nom et prénom"
              autoComplete="off"
              required
              minLength={2}
              maxLength={100}
            />
            <Champ
              id="email"
              name="email"
              type="email"
              libelle="Adresse email"
              autoComplete="off"
              required
            />
            <ChampListe
              id="typePoste"
              name="typePoste"
              libelle="Type de poste"
              aide="Sert à afficher les zones indicatives du rapport."
              defaultValue=""
              required
            >
              <option value="" disabled>
                Choisir…
              </option>
              {Object.entries(TYPES_POSTE).map(([cle, libelle]) => (
                <option key={cle} value={cle}>
                  {libelle}
                </option>
              ))}
            </ChampListe>
            <Alerte ton="attention">
              Il vous reste <strong>{restantes}</strong> candidat{restantes > 1 ? "s" : ""} sur les{" "}
              {limite} de votre essai gratuit.
            </Alerte>
            {etat.erreur && (
              <Alerte ton="erreur" role="alert">
                {etat.erreur}
              </Alerte>
            )}
            {etat.succes && (
              <Alerte ton="succes" role="status">
                {etat.succes}
              </Alerte>
            )}
            <div className="mt-auto flex justify-end gap-2">
              <Bouton variante="secondaire" onClick={() => dialogue.current?.close()}>
                Fermer
              </Bouton>
              <Bouton type="submit" disabled={enCours}>
                {enCours ? "Envoi…" : "Envoyer l'invitation"}
              </Bouton>
            </div>
          </form>
        </div>
      </dialog>
    </>
  );
}
