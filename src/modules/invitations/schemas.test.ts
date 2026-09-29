import { describe, expect, it } from "vitest";

import { idInvitationSchema, invitationSchema } from "./schemas";

describe("invitationSchema", () => {
  it("normalise l'adresse et accepte les deux rôles", () => {
    expect(invitationSchema.parse({ email: " Nouveau@Exemple.FR ", role: "recruteur" })).toEqual({
      email: "nouveau@exemple.fr",
      role: "recruteur",
    });
    expect(invitationSchema.parse({ email: "a@exemple.fr", role: "admin" }).role).toBe("admin");
  });

  it.each(["owner", "member", "admin,member", "", null])("refuse le rôle %s", (role) => {
    expect(invitationSchema.safeParse({ email: "a@exemple.fr", role }).success).toBe(false);
  });
});

describe("idInvitationSchema", () => {
  it("accepte un identifiant Better Auth", () => {
    expect(idInvitationSchema.safeParse("aB3dE5fG7hJ9kL1mN3pQ5rS7tU9vW1xY").success).toBe(true);
  });

  it.each(["", "../espace", "a/b", "a?b=c", "//exemple.fr", "x".repeat(65)])(
    "refuse « %s »",
    (id) => {
      expect(idInvitationSchema.safeParse(id).success).toBe(false);
    },
  );
});
