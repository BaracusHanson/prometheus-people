import type { CSSProperties } from "react";

import { ZONE_MOYENNE } from "@/modules/questionnaire/libelles";
import { CANDIDATE_DEMO, TRAITS_DEMO } from "@/modules/site/scene";

// Objets produit du site public : des morceaux de la vraie interface (rangs, badges,
// fiabilité), remplis avec une candidate fictive. CSS seul ; mouvement dans site.css.

type Style = CSSProperties & Record<`--${string}`, string | number>;

// Chiffre animé : le vrai chiffre est lu par les lecteurs d'écran, l'animation est muette.
export function Compteur({
  valeur,
  suffixe = "",
  depart = 0,
  retard = 0,
  mode,
  className,
}: {
  valeur: number;
  suffixe?: string;
  depart?: number;
  retard?: number;
  // « chargement » : joué à l'affichage de la page ; « scene » : joué par une Scene.
  mode: "chargement" | "scene";
  className?: string;
}) {
  const style: Style = {
    "--cible": valeur,
    "--depart": depart,
    "--retard": `${retard}ms`,
    "--suffixe": `"${suffixe}"`,
  };
  return (
    <span className={className}>
      <span className="sr-only">
        {valeur}
        {suffixe}
      </span>
      <span
        aria-hidden="true"
        style={style}
        className={`pp-compteur chiffres ${
          mode === "chargement" ? "pp-construit-compteur" : "pp-compteur-scene"
        }`}
      />
    </span>
  );
}

// Échelle de rang de 1 à 99 avec la zone moyenne, comme dans le rapport. Le point part du
// milieu et glisse jusqu'au rang : on voit la mesure se placer.
export function Rail({
  rang,
  retard = 0,
  mode,
  petit = false,
  accent = false,
}: {
  rang: number;
  retard?: number;
  mode: "chargement" | "scene";
  petit?: boolean;
  accent?: boolean;
}) {
  const style: Style = { left: `${rang}%`, "--rang": rang, "--retard": `${retard}ms` };
  return (
    <span
      aria-hidden="true"
      className={`relative block [container-type:inline-size] ${petit ? "h-3" : "h-4"}`}
    >
      <span
        className="absolute inset-y-0 block bg-bleu-pale"
        style={{
          left: `${ZONE_MOYENNE.debut}%`,
          width: `${ZONE_MOYENNE.fin - ZONE_MOYENNE.debut}%`,
        }}
      />
      <span className="absolute inset-x-0 top-1/2 block h-px -translate-y-1/2 bg-champ" />
      <span
        style={style}
        className={`absolute top-1/2 block -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-white ${
          petit ? "size-3.5" : "size-[18px]"
        } ${accent ? "bg-bleu ring-2 ring-bleu/30" : "bg-bleu ring-[1.5px] ring-bleu"} ${
          mode === "chargement" ? "pp-construit-rail" : "pp-rail"
        }`}
      />
    </span>
  );
}

// En-tête d'échelle partagé : 1, zone moyenne, 99.
export function EchelleRang({ className = "" }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={`relative block h-4 text-[11px] font-bold tracking-[0.06em] text-gris uppercase ${className}`}
    >
      <span className="absolute left-0">1</span>
      <span
        className="absolute text-center text-bleu-fonce"
        style={{
          left: `${ZONE_MOYENNE.debut}%`,
          width: `${ZONE_MOYENNE.fin - ZONE_MOYENNE.debut}%`,
        }}
      >
        zone moyenne
      </span>
      <span className="absolute right-0">99</span>
    </span>
  );
}

const ETAPES_HEROS = ["Invitée", "Lien ouvert", "118 réponses", "Profil prêt"];

// Héros : le profil se construit sous les yeux du visiteur, dans l'ordre où le produit
// le fabrique (invitation, réponses, calcul des rangs, fiabilité, point à creuser).
export function ProfilVivant() {
  const retard = (ms: number): Style => ({ "--retard": `${ms}ms` });
  return (
    <figure className="relative w-full max-w-[600px] max-lg:mx-auto">
      {/* Papier millimétré : on est dans un instrument de mesure. */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -inset-x-8 -inset-y-10 rounded-bloc bg-[linear-gradient(var(--color-trait)_1px,transparent_1px),linear-gradient(90deg,var(--color-trait)_1px,transparent_1px)] mask-[radial-gradient(ellipse_at_center,black_45%,transparent_78%)] bg-size-[24px_24px] max-md:hidden"
      />

      <ol
        aria-label="Où en est la candidate"
        className="relative mb-3 grid grid-cols-4 gap-2 text-[12px] font-bold text-gris"
      >
        {ETAPES_HEROS.map((etape, i) => (
          <li key={etape} className="flex flex-col gap-1.5">
            <span className="relative block h-[3px] overflow-hidden rounded-full bg-trait">
              <span
                className="pp-construit-barre absolute inset-0 block bg-bleu"
                style={retard(120 + i * 180)}
              />
            </span>
            <span className="truncate">{etape}</span>
          </li>
        ))}
      </ol>

      <div
        className="pp-construit relative flex flex-col gap-4 rounded-bloc border border-bordure bg-white p-5 shadow-[0_1px_0_var(--color-bordure),0_30px_60px_-30px_color-mix(in_oklch,var(--color-encre)_35%,transparent)] md:p-6"
        style={retard(0)}
      >
        <div className="flex items-start gap-3">
          <span
            aria-hidden="true"
            className="flex size-11 shrink-0 items-center justify-center rounded-full bg-bleu-pale text-[15px] font-extrabold text-bleu-fonce"
          >
            {CANDIDATE_DEMO.initiales}
          </span>
          <span className="flex min-w-0 grow flex-col">
            <span className="text-[22px] leading-tight font-extrabold font-stretch-[75%]">
              {CANDIDATE_DEMO.nom}
            </span>
            <span className="text-sm text-gris">
              {CANDIDATE_DEMO.poste} · test terminé en {CANDIDATE_DEMO.duree}
            </span>
          </span>
          <span
            className="pp-construit-allume rounded-full bg-vert-pale px-2.5 py-1 text-[12px] font-extrabold text-vert"
            style={retard(780)}
          >
            Terminé
          </span>
        </div>

        <div className="flex flex-col gap-1.5">
          <span className="flex items-baseline justify-between text-[13px] font-bold">
            <span className="text-gris">Réponses analysées</span>
            <Compteur
              valeur={118}
              mode="chargement"
              retard={200}
              className="text-[15px] font-extrabold"
            />
          </span>
          <span className="relative block h-1 overflow-hidden rounded-full bg-trait">
            <span
              className="pp-construit-barre absolute inset-0 block bg-bleu"
              style={retard(200)}
            />
          </span>
        </div>

        <div className="flex flex-col gap-2.5">
          <div className="grid grid-cols-[minmax(0,1fr)_40px] items-end gap-x-3 sm:grid-cols-[186px_minmax(0,1fr)_40px]">
            <span className="text-[11px] font-bold tracking-[0.06em] text-gris uppercase max-sm:hidden">
              Trait
            </span>
            <EchelleRang />
            <span className="text-right text-[11px] font-bold tracking-[0.06em] text-gris uppercase">
              Rang
            </span>
          </div>
          <dl className="flex flex-col gap-2.5">
            {TRAITS_DEMO.map((t, i) => (
              <div
                key={t.trait}
                className="grid grid-cols-[minmax(0,1fr)_40px] items-center gap-x-3 gap-y-1 sm:grid-cols-[186px_minmax(0,1fr)_40px]"
              >
                <dt className="text-[15px] font-bold max-sm:col-span-2">{t.nom}</dt>
                <dd>
                  <Rail rang={t.rang} mode="chargement" retard={520 + i * 90} />
                </dd>
                <dd className="text-right text-lg leading-none font-extrabold font-stretch-[75%]">
                  <Compteur
                    valeur={t.rang}
                    suffixe="e"
                    depart={50}
                    mode="chargement"
                    retard={520 + i * 90}
                  />
                </dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="grid gap-3 border-t border-trait pt-4 sm:grid-cols-[150px_minmax(0,1fr)]">
          <div className="pp-construit flex flex-col gap-1" style={retard(1080)}>
            <span className="text-[11px] font-bold tracking-[0.06em] text-gris uppercase">
              Fiabilité
            </span>
            <span className="w-fit rounded-full bg-vert-pale px-2.5 py-1 text-[13px] font-extrabold text-vert">
              Réponses fiables
            </span>
            <span className="text-[12px] text-gris">2 contrôles sur 2</span>
          </div>
          <div
            className="pp-construit flex flex-col gap-1 rounded-controle bg-bleu-pale/60 px-3.5 py-3"
            style={retard(1220)}
          >
            <span className="text-[11px] font-bold tracking-[0.06em] text-bleu-fonce uppercase">
              À creuser en entretien
            </span>
            <span className="text-[14px] leading-snug">
              Conscienciosité : l&apos;ordre (22e rang) est nettement plus bas que le reste du
              trait.
            </span>
          </div>
        </div>
      </div>
      <figcaption className="relative mt-3 text-[12px] text-gris">
        Profil fictif. Rangs de 1 à 99 par rapport à un échantillon de référence.
      </figcaption>
    </figure>
  );
}
