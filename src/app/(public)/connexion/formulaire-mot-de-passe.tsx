"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

// Connexion par mot de passe (ADR-0026). Le formulaire écrit directement à la route de
// Better Auth (/api/auth/sign-in/email) et non à une server action : la limite d'essais
// de Better Auth ne s'applique qu'aux requêtes reçues par cette route.
export function FormulaireMotDePasse({ suite }: { suite: string | null }) {
  const [erreur, setErreur] = useState<string | null>(null);
  const [enCours, setEnCours] = useState(false);

  async function envoyer(formulaire: HTMLFormElement) {
    setErreur(null);
    setEnCours(true);
    const donnees = new FormData(formulaire);
    const texte = (cle: string) => {
      const valeur = donnees.get(cle);
      return typeof valeur === "string" ? valeur : "";
    };
    try {
      const reponse = await fetch("/api/auth/sign-in/email", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          email: texte("email").trim(),
          password: texte("password"),
        }),
      });
      if (reponse.ok) {
        window.location.assign(suite ?? "/espace");
        return;
      }
      // Même message que l'adresse existe ou non : on ne révèle pas qui a un compte.
      setErreur(
        reponse.status === 429
          ? "Trop d'essais. Patientez une minute, ou recevez un lien de connexion."
          : "Adresse email ou mot de passe incorrect.",
      );
    } catch {
      setErreur("Connexion impossible pour le moment. Réessayez.");
    }
    setEnCours(false);
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        void envoyer(e.currentTarget);
      }}
      className="flex flex-col gap-4"
    >
      <Field>
        <FieldLabel htmlFor="email-mdp">Adresse email</FieldLabel>
        <Input id="email-mdp" name="email" type="email" autoComplete="username" required />
      </Field>
      <Field data-invalid={erreur ? true : undefined}>
        <FieldLabel htmlFor="mot-de-passe">Mot de passe</FieldLabel>
        <Input
          id="mot-de-passe"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          aria-invalid={erreur ? true : undefined}
          aria-describedby={erreur ? "mot-de-passe-erreur" : undefined}
        />
        <FieldError id="mot-de-passe-erreur">{erreur}</FieldError>
      </Field>
      <Button type="submit" disabled={enCours} className="w-full">
        {enCours ? "Connexion…" : "Me connecter"}
      </Button>
    </form>
  );
}
