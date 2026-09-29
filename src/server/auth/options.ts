import type { BetterAuthOptions } from "better-auth";
import { APIError } from "better-auth/api";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { magicLink, organization } from "better-auth/plugins";

// Configuration Better Auth, source UNIQUE partagée par l'application (./index.ts)
// et par la génération du schéma (scripts/auth-schema.config.ts) : les tables
// générées correspondent toujours exactement aux modules utilisés (ADR-0016).
//
// Volontairement sans `server-only` ni lecture d'environnement : les dépendances
// (base, secret, envoi d'email) sont injectées, ce qui permet aussi de tester.

export type EnvoiLienMagique = (donnees: { email: string; url: string }) => Promise<void>;

export type EnvoiInvitation = (donnees: {
  email: string;
  url: string;
  agence: string;
  role: string;
}) => Promise<void>;

export interface DependancesAuth {
  // Instance Drizzle (ou objet factice pour la génération du schéma).
  db: Parameters<typeof drizzleAdapter>[0];
  schema?: Record<string, unknown>;
  baseURL: string;
  secret: string;
  secureCookies: boolean;
  envoyerLienMagique: EnvoiLienMagique;
  envoyerInvitation: EnvoiInvitation;
  // Vrai si l'utilisateur appartient déjà à une agence (une seule agence par personne en v1).
  estMembreDUneAgence: (userId: string) => Promise<boolean>;
}

export const DUREE_LIEN_MAGIQUE_SECONDES = 10 * 60;
export const DUREE_INVITATION_JOURS = 7;

// Rôles Better Auth attribuables par invitation ou changement de rôle : « admin » et
// « member » (affiché « recruteur »). Le rôle par défaut « owner » de Better Auth, ou
// une combinaison de rôles (« admin,member »), n'ont pas de sens chez nous.
export const ROLES_ATTRIBUABLES: readonly string[] = ["admin", "member"];

export const CODE_DEJA_MEMBRE = "DEJA_MEMBRE_D_UNE_AGENCE";

function exigerRoleAttribuable(role: string | null | undefined): void {
  if (!role || !ROLES_ATTRIBUABLES.includes(role)) {
    throw new APIError("BAD_REQUEST", { message: "Rôle non autorisé." });
  }
}

// Une personne n'appartient qu'à une seule agence en v1 (ADR-0017).
async function exigerSansAgence(deps: DependancesAuth, userId: string): Promise<void> {
  if (await deps.estMembreDUneAgence(userId)) {
    throw new APIError("FORBIDDEN", {
      code: CODE_DEJA_MEMBRE,
      message: "Cette personne appartient déjà à une agence.",
    });
  }
}

export function creerOptionsAuth(deps: DependancesAuth) {
  return {
    appName: "Prometheus People",
    baseURL: deps.baseURL,
    secret: deps.secret,
    database: drizzleAdapter(deps.db, { provider: "pg", schema: deps.schema }),

    // Connexion uniquement par lien magique : aucun mot de passe stocké.
    emailAndPassword: { enabled: false },

    session: {
      expiresIn: 60 * 60 * 24 * 7, // 7 jours
      updateAge: 60 * 60 * 24, // prolongée au plus une fois par jour
    },

    advanced: { useSecureCookies: deps.secureCookies },
    telemetry: { enabled: false },

    plugins: [
      magicLink({
        expiresIn: DUREE_LIEN_MAGIQUE_SECONDES,
        // Le jeton n'est stocké que haché : une fuite de la base ne permet pas
        // d'utiliser un lien en cours de validité (ADR-0005).
        storeToken: "hashed",
        sendMagicLink: ({ email, url }) => deps.envoyerLienMagique({ email, url }),
      }),
      // Agences (ADR-0017) et invitations (ADR-0018). Le créateur devient « admin » ; les
      // invités sont « admin » ou « member » (affiché « recruteur »).
      //
      // Les règles sont appliquées ICI, dans les hooks de Better Auth, et pas seulement
      // dans nos server actions : les points d'accès /api/auth/organization/* sont publics
      // et appelables directement.
      organization({
        allowUserToCreateOrganization: async (user) => !(await deps.estMembreDUneAgence(user.id)),
        creatorRole: "admin",
        disableOrganizationDeletion: true,
        invitationExpiresIn: DUREE_INVITATION_JOURS * 24 * 60 * 60,
        invitationLimit: 50,
        // Réinviter la même adresse annule l'invitation précédente : un seul lien valide.
        cancelPendingInvitationsOnReInvite: true,
        // Accepter une invitation exige une adresse vérifiée. Toujours vrai après une
        // connexion par lien magique, mais on ne dépend pas de ce détail.
        requireEmailVerificationOnInvitation: true,
        sendInvitationEmail: ({ id, email, role, organization }) =>
          deps.envoyerInvitation({
            email,
            url: `${deps.baseURL}/invitation/${encodeURIComponent(id)}`,
            agence: organization.name,
            role,
          }),
        organizationHooks: {
          // Pas de vérification « déjà membre d'une agence » à l'envoi : elle révélerait
          // à une agence qu'une adresse travaille pour une autre. Elle a lieu à l'acceptation.
          beforeCreateInvitation: ({ invitation }) => {
            exigerRoleAttribuable(invitation.role);
            return Promise.resolve();
          },
          beforeAcceptInvitation: async ({ invitation, user }) => {
            exigerRoleAttribuable(invitation.role);
            await exigerSansAgence(deps, user.id);
          },
          beforeAddMember: async ({ member, user }) => {
            exigerRoleAttribuable(member.role);
            await exigerSansAgence(deps, user.id);
          },
          beforeUpdateMemberRole: ({ newRole }) => {
            exigerRoleAttribuable(newRole);
            return Promise.resolve();
          },
        },
      }),
      // Doit rester le dernier module : pose les cookies depuis les server actions.
      nextCookies(),
    ],
  } satisfies BetterAuthOptions;
}
