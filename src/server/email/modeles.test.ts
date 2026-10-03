import { describe, expect, it } from "vitest";

import {
  echapperHtml,
  emailInvitation,
  emailInvitationCandidat,
  emailLienMagique,
  emailMotDePasseModifie,
} from "./modeles";

describe("emailMotDePasseModifie", () => {
  it("prévient du changement, sans contenir le mot de passe, avec un lien échappé", () => {
    const email = emailMotDePasseModifie("a@exemple.fr", 'https://x.exemple/connexion?a="b"');
    expect(email.objet).toBe("Votre mot de passe Prometheus People a été modifié");
    expect(email.texte).toContain("Si ce n'est pas vous");
    expect(email.html).toContain("&quot;b&quot;");
    expect(email.html).not.toContain('"b"');
  });
});

describe("echapperHtml", () => {
  it("neutralise les caractères HTML", () => {
    expect(echapperHtml(`<script>alert("x")</script> & 'y'`)).toBe(
      "&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt; &amp; &#39;y&#39;",
    );
  });
});

describe("emailLienMagique", () => {
  const url =
    "https://prometheus-people.com/api/auth/magic-link/verify?token=abc&callbackURL=%2Fespace";

  it("contient le lien, la durée de validité et l'avertissement", () => {
    const email = emailLienMagique("recruteur@agence.fr", url, 10);

    expect(email.a).toBe("recruteur@agence.fr");
    expect(email.objet).toMatch(/lien de connexion/);
    expect(email.texte).toContain(url);
    expect(email.texte).toMatch(/10 minutes/);
    expect(email.texte).toMatch(/une seule fois/);
    expect(email.texte).toMatch(/ignorez simplement cet email/);
  });

  it("échappe le lien dans la version HTML", () => {
    const email = emailLienMagique("a@b.fr", `${url}"><script>`, 10);

    expect(email.html).not.toContain("<script>");
    expect(email.html).toContain("&amp;callbackURL");
  });
});

describe("emailInvitation", () => {
  const invitation = {
    url: "https://prometheus-people.com/invitation/abc123",
    agence: "Intérim Exemple",
    role: "member",
    dureeJours: 7,
  };

  it("contient le lien, l'agence, le rôle et la durée de validité", () => {
    const email = emailInvitation("recruteur@exemple.fr", invitation);

    expect(email.a).toBe("recruteur@exemple.fr");
    expect(email.texte).toContain(invitation.url);
    expect(email.texte).toContain("« Intérim Exemple »");
    expect(email.texte).toMatch(/avec le rôle Recruteur/);
    expect(email.texte).toMatch(/7 jours/);
  });

  it("n'accorde rien au masculin : la personne invitée peut être une femme", () => {
    const email = emailInvitation("a@b.fr", invitation);
    expect(`${email.texte} ${email.html}`).not.toMatch(/invité|en tant que/);
  });

  it("affiche le rôle Administrateur pour une invitation admin", () => {
    expect(emailInvitation("a@b.fr", { ...invitation, role: "admin" }).texte).toMatch(
      /avec le rôle Administrateur\./,
    );
  });

  it("n'insère jamais le nom de l'agence dans l'objet ni en HTML brut", () => {
    const email = emailInvitation("a@b.fr", { ...invitation, agence: `<img src=x onerror="y">` });

    expect(email.objet).not.toContain("<img");
    expect(email.html).not.toContain("<img");
    expect(email.html).toContain("&lt;img src=x onerror=&quot;y&quot;&gt;");
  });
});

describe("emailInvitationCandidat", () => {
  const donnees = {
    nom: "Martin Dupuis",
    agence: "Intérim Exemple",
    poste: "Cariste",
    url: "https://prometheus-people.com/passation/abc",
    expireLe: new Date("2026-10-06T10:00:00Z"),
  };

  it("contient le lien, l'agence, le poste et la date limite", () => {
    const email = emailInvitationCandidat("martin@example.com", donnees);

    expect(email.a).toBe("martin@example.com");
    expect(email.texte).toContain(donnees.url);
    expect(email.texte).toContain("« Intérim Exemple »");
    expect(email.texte).toContain("poste de cariste");
    expect(email.texte).toContain("6 octobre 2026");
    expect(email.texte).toMatch(/ne fonctionne qu'une fois/);
  });

  it("échappe le nom du candidat et de l'agence, et les garde hors de l'objet", () => {
    const email = emailInvitationCandidat("a@b.fr", {
      ...donnees,
      nom: "<b>x</b>",
      agence: `<img src=x onerror="y">`,
    });

    expect(email.objet).toBe("Votre questionnaire avant l'entretien");
    expect(email.html).not.toContain("<img");
    expect(email.html).not.toContain("<b>x</b>");
    expect(email.html).toContain("&lt;b&gt;x&lt;/b&gt;");
  });
});
