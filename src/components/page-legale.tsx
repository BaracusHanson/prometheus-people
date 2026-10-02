import Link from "next/link";
import { Fragment } from "react";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  MISE_A_JOUR,
  type Bloc,
  type Paragraphe,
  type TexteLegal,
} from "@/modules/site/textes-legaux";

// Mise en page des textes légaux (maquette P4) : sommaire à gauche, texte à droite. Les
// passages entre crochets restent à compléter : ils sont surlignés, jamais cachés.

const TROU = /(\[[^\]\n]+\])/;

export function decouperTrous(texte: string): { texte: string; trou: boolean }[] {
  return texte
    .split(TROU)
    .filter(Boolean)
    .map((morceau) => ({ texte: morceau, trou: TROU.test(morceau) }));
}

function Texte({ texte }: { texte: string }) {
  return decouperTrous(texte).map((m, i) =>
    m.trou ? (
      <mark key={i} className="rounded-sm bg-ambre-pale px-1 text-ambre-fonce">
        {m.texte}
      </mark>
    ) : (
      <Fragment key={i}>{m.texte}</Fragment>
    ),
  );
}

function Contenu({ gras, texte, lien }: Paragraphe) {
  return (
    <>
      {gras && <strong>{gras} </strong>}
      <Texte texte={texte} />
      {lien && (
        <>
          {" "}
          <Link href={lien.href} className="font-bold text-bleu underline underline-offset-2">
            {lien.libelle}
          </Link>
          .
        </>
      )}
    </>
  );
}

function BlocLegal({ bloc }: { bloc: Bloc }) {
  if (bloc.type === "p") {
    return (
      <p>
        <Contenu {...bloc} />
      </p>
    );
  }
  if (bloc.type === "liste") {
    return (
      <ul className="flex list-disc flex-col gap-2 pl-6">
        {bloc.elements.map((e) => (
          <li key={e.texte}>
            <Contenu {...e} />
          </li>
        ))}
      </ul>
    );
  }
  return (
    <div className="overflow-x-auto rounded-bloc border border-bordure text-[15px] leading-snug">
      <Table>
        <caption className="sr-only">{bloc.legende}</caption>
        <TableHeader>
          <TableRow>
            {bloc.entetes.map((e) => (
              <TableHead key={e} className="min-w-36 whitespace-normal">
                {e}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {bloc.lignes.map((ligne) => (
            <TableRow key={ligne.join("|")}>
              {ligne.map((cellule, i) => (
                <TableCell key={i} className="align-top whitespace-normal">
                  <Texte texte={cellule} />
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export function PageLegale({ texte }: { texte: TexteLegal }) {
  const brouillon = JSON.stringify(texte).match(TROU) !== null;
  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-10 px-4 pt-10 pb-14 md:px-8 md:pt-16 md:pb-20 lg:grid-cols-[240px_minmax(0,760px)] lg:gap-16 xl:grid-cols-[280px_minmax(0,760px)] xl:px-16">
      <nav
        aria-label="Sommaire"
        className="hidden flex-col gap-1 self-start lg:sticky lg:top-6 lg:flex"
      >
        <span className="mb-1.5 text-sm font-extrabold text-gris">Sur cette page</span>
        {texte.sections.map((s) => (
          <a
            key={s.id}
            href={`#${s.id}`}
            className="border-l-[3px] border-trait px-3 py-2 text-[15px] text-encre no-underline hover:border-bleu"
          >
            {s.titre}
          </a>
        ))}
      </nav>
      <article className="flex flex-col gap-5 text-[17px] leading-[1.7]">
        <h1 className="text-[40px] leading-[1.05] font-extrabold font-stretch-[70%] text-balance md:text-[52px]">
          {texte.titre}
        </h1>
        <p className="text-gris">Dernière mise à jour : {MISE_A_JOUR}.</p>
        {brouillon && (
          <p className="rounded-bloc bg-ambre-pale px-5 py-4 text-base text-ambre-fonce">
            Brouillon en cours de relecture juridique : les passages surlignés restent à compléter.
          </p>
        )}
        <p>{texte.introduction}</p>
        {texte.sections.map((s) => (
          <section key={s.id} aria-labelledby={s.id} className="flex flex-col gap-4">
            <h2
              id={s.id}
              className="mt-3 scroll-mt-6 text-[26px] leading-tight font-extrabold font-stretch-[80%] md:text-[28px]"
            >
              {s.titre}
            </h2>
            {s.blocs.map((b, i) => (
              <BlocLegal key={i} bloc={b} />
            ))}
          </section>
        ))}
      </article>
    </div>
  );
}
