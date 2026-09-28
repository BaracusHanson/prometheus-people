import { describe, expect, it } from "vitest";

import { echapperHtml, emailLienMagique } from "./modeles";

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
