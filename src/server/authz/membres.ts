import "server-only";

import { eq } from "drizzle-orm";

import { getDb } from "@/server/db/client";
import { member } from "@/server/db/schema";

// Lecture de l'appartenance à une agence, directement en base (ADR-0017).
// Séparé de ./index.ts pour être utilisable par la configuration Better Auth
// sans dépendance circulaire.

export interface Adhesion {
  organizationId: string;
  role: string;
}

export async function adhesionsDe(userId: string): Promise<Adhesion[]> {
  return getDb()
    .select({ organizationId: member.organizationId, role: member.role })
    .from(member)
    .where(eq(member.userId, userId));
}

export async function estMembreDUneAgence(userId: string): Promise<boolean> {
  return (await adhesionsDe(userId)).length > 0;
}
