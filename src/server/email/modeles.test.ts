import { describe, expect, it } from "vitest";

import { echapperHtml, emailInvitation, emailLienMagique } from "./modeles";

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
    expect(email.texte).toMatch(/en tant que recruteur/);
    expect(email.texte).toMatch(/7 jours/);
  });

  it("affiche « administrateur » pour une invitation admin", () => {
    expect(emailInvitation("a@b.fr", { ...invitation, role: "admin" }).texte).toMatch(
      /en tant qu'administrateur\./,
    );
  });

  it("n'insère jamais le nom de l'agence dans l'objet ni en HTML brut", () => {
    const email = emailInvitation("a@b.fr", { ...invitation, agence: `<img src=x onerror="y">` });

    expect(email.objet).not.toContain("<img");
    expect(email.html).not.toContain("<img");
    expect(email.html).toContain("&lt;img src=x onerror=&quot;y&quot;&gt;");
  });
});
