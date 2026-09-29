"use client";

import { useActionState } from "react";

import { Alerte } from "@/components/ui/alerte";
import { Bouton } from "@/components/ui/bouton";
import { Champ, ChampListe } from "@/components/ui/champ";
import { inviterMembre, type EtatInvitation } from "@/modules/invitations/actions";

const ETAT_INITIAL: EtatInvitation = {};

export function FormulaireInvitation() {
  const [etat, action, enCours] = useActionState(inviterMembre, ETAT_INITIAL);

  return (
    <form action={action} className="flex flex-col gap-4">
      <Champ
        id="email-invite"
        name="email"
        type="email"
        libelle="Adresse email"
        autoComplete="off"
        required
      />
      <ChampListe id="role-invite" name="role" libelle="Rôle" defaultValue="recruteur">
        <option value="recruteur">Recruteur</option>
        <option value="admin">Administrateur</option>
      </ChampListe>
      <Bouton type="submit" disabled={enCours}>
        {enCours ? "Envoi…" : "Envoyer l'invitation"}
      </Bouton>
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
    </form>
  );
}
