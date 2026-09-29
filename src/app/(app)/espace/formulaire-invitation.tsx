"use client";

import { useActionState } from "react";

import { inviterMembre, type EtatInvitation } from "@/modules/invitations/actions";

const ETAT_INITIAL: EtatInvitation = {};

export function FormulaireInvitation() {
  const [etat, action, enCours] = useActionState(inviterMembre, ETAT_INITIAL);

  return (
    <form action={action}>
      <label htmlFor="email-invite">Adresse email</label>
      <input id="email-invite" name="email" type="email" autoComplete="off" required />
      <label htmlFor="role-invite">Rôle</label>
      <select id="role-invite" name="role" defaultValue="recruteur">
        <option value="recruteur">Recruteur</option>
        <option value="admin">Administrateur</option>
      </select>
      <button type="submit" disabled={enCours}>
        {enCours ? "Envoi…" : "Envoyer l'invitation"}
      </button>
      {etat.erreur && <p role="alert">{etat.erreur}</p>}
      {etat.succes && <p role="status">{etat.succes}</p>}
    </form>
  );
}
