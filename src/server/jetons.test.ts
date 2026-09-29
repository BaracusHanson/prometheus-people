import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const { empreinteJeton, estFormatJeton, genererJeton } = await import("./jetons");

describe("jetons", () => {
  it("génère 256 bits aléatoires, différents à chaque appel", () => {
    const a = genererJeton();
    const b = genererJeton();

    expect(estFormatJeton(a)).toBe(true);
    expect(Buffer.from(a, "base64url")).toHaveLength(32);
    expect(a).not.toBe(b);
  });

  it("donne une empreinte SHA-256 stable qui ne contient pas le jeton", () => {
    const jeton = genererJeton();

    expect(empreinteJeton(jeton)).toMatch(/^[0-9a-f]{64}$/);
    expect(empreinteJeton(jeton)).toBe(empreinteJeton(jeton));
    expect(empreinteJeton(jeton)).not.toContain(jeton);
  });

  it.each([undefined, "", "trop-court", "a".repeat(44), "a".repeat(42) + "!", "../../x"])(
    "refuse un format invalide : %s",
    (valeur) => {
      expect(estFormatJeton(valeur)).toBe(false);
    },
  );
});
