import { appliquerMigrations } from "@/server/db/migrate";
import { getEnv } from "@/server/env";
import { demarrerSuivi } from "@/server/erreurs";

// Démarrage côté Node : refuse de démarrer si la configuration est invalide ou si
// une migration échoue (ADR-0014). Le message ne contient jamais de valeur secrète.
export async function demarrerServeur(): Promise<void> {
  try {
    const env = getEnv();
    demarrerSuivi(env);
    await appliquerMigrations();
  } catch (erreur) {
    console.error("[démarrage] Arrêt du serveur :", (erreur as Error).message);
    process.exit(1);
  }
}
