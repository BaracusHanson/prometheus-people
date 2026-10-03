import { EMAIL_CONTACT, MENTION_TVA as TVA } from "@/lib/contact";
import { FORFAITS } from "@/modules/candidats/forfaits";

// Textes légaux du site public (brouillons du 30 septembre 2026, à faire relire par un
// juriste). Tout passage entre crochets est un trou à remplir : il est surligné sur la page
// et bloque le déploiement en production tant qu'il en reste
// (scripts/verifier-textes-legaux.mjs, qui lit ce fichier). Ce fichier ne contient donc que
// des textes, sans autre crochet que ces trous.

export type Paragraphe = { gras?: string; texte: string; lien?: { href: string; libelle: string } };

export type Bloc =
  | ({ type: "p" } & Paragraphe)
  | { type: "liste"; elements: Paragraphe[] }
  | { type: "tableau"; legende: string; entetes: string[]; lignes: string[][] };

export type Section = { id: string; titre: string; blocs: Bloc[] };

export type TexteLegal = {
  titre: string;
  description: string;
  introduction: string;
  sections: Section[];
};

export const MISE_A_JOUR = "2 octobre 2026";

// L'éditeur est un entrepreneur individuel (avis de situation SIRENE).
const EDITEUR = "Junior Guinier, entrepreneur individuel (EI)";
const SIREN = "993 326 420";
const ADRESSE = "[À COMPLÉTER : adresse de domiciliation]";

const p = (texte: string, gras?: string): Bloc => ({ type: "p", texte, gras });

const MENTIONS: TexteLegal = {
  titre: "Mentions légales",
  description: "Éditeur, directeur de la publication et hébergeurs du site Prometheus People.",
  introduction:
    "Informations prévues par la loi pour la confiance dans l'économie numérique (loi n° 2004-575 du 21 juin 2004, article 6).",
  sections: [
    {
      id: "editeur",
      titre: "Éditeur du site",
      blocs: [
        p(
          `Le site prometheus-people.com et le service Prometheus People sont édités par ${EDITEUR}, SIREN ${SIREN}, adresse : ${ADRESSE}. ${TVA}. Contact : ${EMAIL_CONTACT}.`,
        ),
      ],
    },
    {
      id: "directeur",
      titre: "Directeur de la publication",
      blocs: [p("Junior Guinier.")],
    },
    {
      id: "hebergement",
      titre: "Hébergement",
      blocs: [
        {
          type: "liste",
          elements: [
            {
              gras: "Serveur de l'application :",
              texte:
                "Hostinger International Ltd., [adresse à vérifier sur le site de Hostinger], centre de données situé à Paris (France).",
            },
            {
              gras: "Base de données :",
              texte:
                "Neon, Inc., [adresse à vérifier], données stockées dans la région AWS eu-central-1 (Francfort, Allemagne).",
            },
          ],
        },
      ],
    },
    {
      id: "propriete",
      titre: "Propriété intellectuelle",
      blocs: [
        p(
          "Les textes, la marque, le logo et le code du service appartiennent à Junior Guinier (EI), sauf mention contraire. Le questionnaire utilisé repose sur l'IPIP-NEO, inventaire du domaine public (ipip.ori.org), dans l'adaptation française de B. Thiry et M. Piolti (2023).",
        ),
      ],
    },
    {
      id: "donnees",
      titre: "Données personnelles",
      blocs: [
        {
          type: "p",
          texte: "Leur traitement est décrit dans la",
          lien: { href: "/confidentialite", libelle: "politique de confidentialité" },
        },
      ],
    },
  ],
};

const CONFIDENTIALITE: TexteLegal = {
  titre: "Politique de confidentialité",
  description:
    "Quelles données Prometheus People traite, pourquoi, combien de temps, où elles sont stockées et comment exercer vos droits.",
  introduction:
    "Prometheus People est responsable des données des agences clientes et des visiteurs du site. Pour les candidats, c'est l'agence qui les invite qui est responsable : Prometheus People n'agit que pour elle, dans les conditions de l'accord de sous-traitance.",
  sections: [
    {
      id: "responsable",
      titre: "Qui traite vos données",
      blocs: [
        p(
          `${EDITEUR}, éditeur de Prometheus People, ${ADRESSE}, contact : ${EMAIL_CONTACT}.`,
          "Responsable du traitement.",
        ),
        {
          type: "p",
          gras: "Vous êtes candidat ou candidate ?",
          texte:
            "L'agence qui vous a invité est responsable de vos données ; ses coordonnées s'affichent avant le questionnaire. Prometheus People héberge vos réponses pour elle et ne les utilise pour rien d'autre. Le détail figure dans",
          lien: { href: "/sous-traitance", libelle: "l'accord de sous-traitance" },
        },
      ],
    },
    {
      id: "donnees",
      titre: "Quelles données, pourquoi, combien de temps",
      blocs: [
        {
          type: "tableau",
          legende: "Données traitées par Prometheus People comme responsable",
          entetes: ["Personnes", "Données", "Finalité", "Base légale", "Durée de conservation"],
          lignes: [
            [
              "Utilisateurs des agences (administrateurs, recruteurs)",
              "Nom, email, agence, rôle, sessions de connexion",
              "Donner accès au service",
              "Exécution du contrat",
              "Durée du compte, puis [À COMPLÉTER]",
            ],
            [
              "Utilisateurs des agences",
              "Journal d'audit : qui a consulté, imprimé ou supprimé quel candidat, et quand",
              "Sécurité, preuve des accès aux données des candidats",
              "Intérêt légitime et obligation de sécurité (art. 32 RGPD)",
              "Tant que l'agence existe",
            ],
            [
              "Clients payants",
              "Coordonnées de facturation, factures",
              "Facturation",
              "Obligation légale",
              "10 ans (Code de commerce, art. L123-22)",
            ],
            [
              "Visiteurs du site",
              "Adresse IP dans les journaux techniques du serveur",
              "Sécurité et fonctionnement",
              "Intérêt légitime",
              "[À COMPLÉTER : durée des journaux, à vérifier]",
            ],
          ],
        },
      ],
    },
    {
      id: "connexion",
      titre: "Connexion et cookies",
      blocs: [
        p(
          "Par un lien envoyé par email, valable 10 minutes et utilisable une seule fois, ou par un mot de passe facultatif que l'utilisateur choisit lui-même et qui n'est conservé que sous forme d'empreinte.",
          "Connexion.",
        ),
        p(
          "Le site n'utilise que des cookies nécessaires à son fonctionnement : la session de connexion des agences, la session du candidat pendant le questionnaire et, à la demande d'un utilisateur, l'affichage de données fictives de démonstration. Aucun cookie de mesure d'audience ni de publicité : aucun bandeau de consentement n'est donc nécessaire.",
          "Cookies.",
        ),
      ],
    },
    {
      id: "acces",
      titre: "Qui y a accès",
      blocs: [
        p(
          "Les données ne sont ni vendues ni prêtées. Elles sont traitées par les prestataires techniques listés dans l'accord de sous-traitance : hébergement, base de données, sauvegardes chiffrées, envoi d'emails, suivi des erreurs, paiement.",
          "Destinataires.",
        ),
        p(
          "Les données sont stockées dans l'Union européenne, à une exception : Resend, qui envoie les emails, en conserve le contenu et les journaux aux États-Unis (clauses contractuelles types et Data Privacy Framework). Certains prestataires sont des sociétés américaines (Neon, Resend, Sentry) : [À VÉRIFIER avec le juriste : adhésion au Data Privacy Framework ou clauses contractuelles types de chacun].",
          "Transferts hors de l'Union européenne.",
        ),
        p(
          "Connexions chiffrées (HTTPS), liens des candidats stockés sous forme d'empreinte et à usage unique, sauvegardes chiffrées chaque nuit et conservées 30 jours, accès aux données cloisonné par agence et tracé dans le journal d'audit.",
          "Sécurité.",
        ),
      ],
    },
    {
      id: "droits",
      titre: "Vos droits",
      blocs: [
        p(
          `Accès, rectification, effacement, limitation, opposition et portabilité : écrivez à ${EMAIL_CONTACT}. Réponse sous un mois. Vous pouvez aussi saisir la CNIL (cnil.fr, 3 place de Fontenoy, 75007 Paris).`,
        ),
      ],
    },
  ],
};

const CONDITIONS: TexteLegal = {
  titre: "Conditions générales de vente",
  description:
    "Conditions du service Prometheus People pour les agences d'emploi : essai, forfaits, paiement, résiliation, responsabilité.",
  introduction:
    "Conditions réservées aux professionnels (agences d'emploi). Elles s'appliquent dès la création d'un compte agence et dérogent aux règles protégeant les consommateurs, qui ne sont pas concernés.",
  sections: [
    {
      id: "objet",
      titre: "1. Objet",
      blocs: [
        p(
          `${EDITEUR} (« Prometheus People ») fournit en ligne un service qui permet à une agence d'inviter des candidats à un questionnaire de personnalité et de consulter leur profil pour préparer ses entretiens.`,
        ),
      ],
    },
    {
      id: "essai",
      titre: "2. Essai gratuit",
      blocs: [
        p(
          `Chaque agence peut inviter ${FORFAITS.essai.limite} candidats gratuitement, sans limite de durée et sans moyen de paiement.`,
        ),
      ],
    },
    {
      id: "forfaits",
      titre: "3. Forfaits",
      blocs: [
        p(
          `Forfait ${FORFAITS.agence.libelle} : ${FORFAITS.agence.prixHT} € par mois pour ${FORFAITS.agence.limite} candidats invités par mois. Forfait ${FORFAITS.agence_plus.libelle} : ${FORFAITS.agence_plus.prixHT} € par mois pour ${FORFAITS.agence_plus.limite} candidats invités par mois (${TVA}). L'agence peut changer de forfait d'un mois sur l'autre. Les candidats non utilisés dans le mois ne sont pas reportés. Un candidat compte au moment où il est invité ; une relance ou une suppression ne rend pas de crédit.`,
        ),
      ],
    },
    {
      id: "paiement",
      titre: "4. Commande et paiement",
      blocs: [
        p(
          "Abonnement mensuel payé par carte via un lien de paiement Stripe. Le forfait est activé dans les 24 heures ouvrées qui suivent le paiement. Une facture est émise pour chaque échéance.",
        ),
      ],
    },
    {
      id: "resiliation",
      titre: "5. Durée et résiliation",
      blocs: [
        p(
          "Abonnement sans engagement, résiliable à tout moment avant la prochaine échéance, avec effet à la fin de la période payée. Un impayé non régularisé sous [15] jours entraîne la suspension des nouvelles invitations.",
        ),
      ],
    },
    {
      id: "obligations",
      titre: "6. Obligations de l'agence",
      blocs: [
        p(
          "L'agence informe ses candidats et répond à leurs demandes (l'application affiche l'information et son adresse de contact). Elle utilise le profil comme une aide à l'entretien : aucune décision fondée sur le seul profil, aucune discrimination (Code du travail, art. L1132-1), aucun usage hors recrutement. Elle garde ses accès confidentiels et désigne ses administrateurs.",
        ),
      ],
    },
    {
      id: "limites",
      titre: "7. Limites du questionnaire",
      blocs: [
        p(
          "Le questionnaire repose sur l'IPIP-NEO, du domaine public, dans une adaptation française qui n'a pas fait l'objet d'une étude de validation ; les rangs sont calculés par rapport à un échantillon de volontaires américains. Il décrit des tendances et ne prédit pas la réussite dans un poste.",
        ),
      ],
    },
    {
      id: "disponibilite",
      titre: "8. Disponibilité",
      blocs: [
        p(
          "Prometheus People fait ses meilleurs efforts pour que le service soit accessible (obligation de moyens), sans garantie de disponibilité chiffrée. Les maintenances sont faites autant que possible hors des heures ouvrées.",
        ),
      ],
    },
    {
      id: "donnees",
      titre: "9. Données personnelles",
      blocs: [
        {
          type: "p",
          texte:
            "L'agence est responsable des données de ses candidats ; Prometheus People est son sous-traitant, dans les conditions de l'accord de sous-traitance, qui fait partie du contrat :",
          lien: { href: "/sous-traitance", libelle: "accord de sous-traitance" },
        },
      ],
    },
    {
      id: "responsabilite",
      titre: "10. Responsabilité",
      blocs: [
        p(
          "La responsabilité de Prometheus People est limitée aux dommages directs et plafonnée à [À COMPLÉTER : par exemple les sommes payées sur les 12 derniers mois]. Les décisions de recrutement relèvent de la seule agence.",
        ),
      ],
    },
    {
      id: "fin",
      titre: "11. Fin du contrat",
      blocs: [
        p(
          "À la fin du contrat, les données de l'agence et de ses candidats sont supprimées sous [30] jours, puis disparaissent des sauvegardes au plus 30 jours plus tard. [À DÉCIDER : export proposé avant suppression.]",
        ),
      ],
    },
    {
      id: "modification",
      titre: "12. Modification",
      blocs: [
        p(
          "Prometheus People peut modifier ces conditions en prévenant par email au moins 30 jours avant ; l'agence peut alors résilier sans frais.",
        ),
      ],
    },
    {
      id: "droit",
      titre: "13. Droit applicable",
      blocs: [
        p(
          "Droit français. En cas de litige, et après tentative de règlement amiable, compétence du tribunal de commerce de [ville].",
        ),
      ],
    },
  ],
};

const SOUS_TRAITANCE: TexteLegal = {
  titre: "Accord de sous-traitance",
  description:
    "Annexe aux conditions générales (article 28 du RGPD) : comment Prometheus People traite les données des candidats pour le compte des agences, et avec quels prestataires.",
  introduction:
    "Annexe aux conditions générales de vente, conforme à l'article 28 du RGPD : l'agence (responsable du traitement) confie à Prometheus People (sous-traitant) le traitement des données de ses candidats, pour la durée du contrat.",
  sections: [
    {
      id: "objet",
      titre: "1. Objet et nature",
      blocs: [
        p(
          "Héberger les données des candidats, envoyer leurs invitations, recueillir leurs réponses, calculer et afficher leur profil, les supprimer à la fin de la durée de conservation choisie par l'agence (6, 12 ou 24 mois).",
        ),
      ],
    },
    {
      id: "personnes",
      titre: "2. Personnes et données",
      blocs: [
        p(
          "Candidats invités par l'agence : nom, email, poste visé, réponses au questionnaire, dates, profil calculé. Aucune donnée sensible au sens de l'article 9 n'est demandée.",
        ),
      ],
    },
    {
      id: "instructions",
      titre: "3. Instructions",
      blocs: [
        p(
          "Prometheus People ne traite ces données que sur instruction de l'agence, donnée par l'usage du service et par ce contrat, et jamais pour son propre compte (ni statistiques commerciales, ni entraînement d'un modèle). Il prévient l'agence si une instruction lui semble contraire au RGPD.",
        ),
      ],
    },
    {
      id: "confidentialite",
      titre: "4. Confidentialité",
      blocs: [
        p(
          "Seules les personnes habilitées de Prometheus People accèdent aux données, et seulement pour le support ou la sécurité ; elles sont tenues au secret.",
        ),
      ],
    },
    {
      id: "securite",
      titre: "5. Sécurité",
      blocs: [
        p(
          "Mesures prévues par l'article 32 du RGPD : chiffrement des échanges (HTTPS) ; liens des candidats stockés sous forme d'empreinte, à usage unique et expirant après 7 jours ; cloisonnement strict entre agences, vérifié par des tests automatiques ; journal d'audit des consultations, impressions et suppressions ; sauvegardes chiffrées chaque nuit, conservées 30 jours et vérifiées chaque matin ; suivi des erreurs sans donnée personnelle.",
        ),
      ],
    },
    {
      id: "sous-traitants",
      titre: "6. Sous-traitants ultérieurs",
      blocs: [
        p(
          "L'agence autorise ceux listés ci-dessous. Prometheus People la prévient 30 jours avant tout ajout ou remplacement ; l'agence peut s'y opposer et résilier sans frais.",
        ),
        {
          type: "tableau",
          legende: "Sous-traitants ultérieurs autorisés",
          entetes: ["Prestataire", "Service", "Données concernées", "Lieu des données"],
          lignes: [
            [
              "Hostinger International Ltd.",
              "Serveur de l'application",
              "Toutes, pendant leur traitement",
              "Paris, France",
            ],
            ["Neon, Inc.", "Base de données", "Toutes", "Francfort, Allemagne (AWS eu-central-1)"],
            [
              "Backblaze, Inc.",
              "Sauvegardes chiffrées",
              "Toutes, illisibles sans notre clé",
              "Amsterdam, Pays-Bas (région EU Central)",
            ],
            [
              "Resend",
              "Envoi des emails",
              "Nom et email du candidat, nom de l'agence",
              "Envoi depuis l'Irlande ; contenu et journaux conservés aux États-Unis (clauses types, Data Privacy Framework)",
            ],
            [
              "Functional Software, Inc. (Sentry)",
              "Suivi des erreurs",
              "Aucune donnée personnelle (masquées avant envoi)",
              "Allemagne (région UE)",
            ],
          ],
        },
        p(
          "Stripe (paiement) ne reçoit que des données de l'agence, jamais celles des candidats : il n'est pas sous-traitant pour les candidats.",
        ),
      ],
    },
    {
      id: "droits",
      titre: "7. Droits des personnes",
      blocs: [
        p(
          "L'application permet à l'agence de répondre seule (consultation, suppression d'un candidat) ; Prometheus People l'aide sur demande et lui transmet sans délai toute demande reçue directement.",
        ),
      ],
    },
    {
      id: "violation",
      titre: "8. Violation de données",
      blocs: [
        p(
          "Notification à l'agence dans les [48] heures après en avoir pris connaissance, avec les informations utiles à sa propre notification à la CNIL.",
        ),
      ],
    },
    {
      id: "fin",
      titre: "9. Fin du contrat",
      blocs: [
        p(
          "Suppression des données sous [30] jours (elles disparaissent des sauvegardes 30 jours plus tard), [À DÉCIDER : après export si l'agence le demande].",
        ),
      ],
    },
    {
      id: "audit",
      titre: "10. Audit",
      blocs: [
        p(
          "Prometheus People fournit les informations nécessaires pour démontrer le respect de cet accord et permet un audit, à la charge de l'agence, prévenu [30] jours à l'avance.",
        ),
      ],
    },
  ],
};

export const TEXTES_LEGAUX = {
  "mentions-legales": MENTIONS,
  confidentialite: CONFIDENTIALITE,
  "conditions-generales": CONDITIONS,
  "sous-traitance": SOUS_TRAITANCE,
} as const;
