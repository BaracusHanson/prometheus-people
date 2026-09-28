// Exécuté une fois au démarrage du serveur Next.js (jamais pendant `next build`).
//
// L'import est placé DANS la condition : c'est ce qui permet au compilateur de retirer
// ce code de la version « edge » de Next.js, qui n'a pas accès au réseau ni aux fichiers
// (une sortie anticipée `if (…) return;` ne suffit pas).
export async function register(): Promise<void> {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { demarrerServeur } = await import("./instrumentation-node");
    await demarrerServeur();
  }
}
