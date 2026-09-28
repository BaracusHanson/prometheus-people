# ADR-0015 — Sauvegardes de la base de production

- **Statut** : Accepté
- **Date** : 2026-09-28
- **Précise** : [ADR-0003](0003-neon-free-et-sauvegardes.md)

## Contexte

Neon Free ne garde que 6 h d'historique. Les données seront des profils psychologiques de candidats : leur perte est inacceptable, leur fuite aussi. Les sauvegardes doivent exister avant la première donnée réelle, et être gratuites.

## Décision

**Stockage** : Backblaze B2, région **EU Central** (Amsterdam), offre gratuite de 10 Go, sans carte bancaire. Cloudflare R2 a été écarté : il demande une carte même pour l'offre gratuite.

**Bucket** `prometheus-people-sauvegardes-1234` :

- privé, chiffrement côté serveur activé ;
- **Object Lock en mode Governance, rétention par défaut de 30 jours** : aucun fichier ne peut être effacé ni modifié pendant 30 jours, sauf par le compte principal Backblaze ;
- règle de cycle de vie : masquage après 30 jours, effacement 1 jour plus tard (un mois d'historique ; limite aussi la conservation au sens du RGPD).

**Chiffrement** : `age`, par paire de clés.

- Le serveur n'a que la **clé publique** (`AGE_RECIPIENT`) : il chiffre, il ne peut jamais relire une sauvegarde.
- La **clé secrète** est conservée par le responsable dans son gestionnaire de mots de passe et dans le secret GitHub `AGE_SECRET_KEY` (test de restauration). Elle n'a jamais transité par une conversation ni par le serveur.

**Clés Backblaze**

- Serveur : clé limitée au bucket, modèle « Write Only », dans `/srv/prometheus/.env.backup`.
- GitHub : clé limitée au bucket, modèle « Read Only » (`B2_READ_KEY_ID`, `B2_READ_APPLICATION_KEY`).

**Sauvegarde** : chaque nuit vers 3 h (heure de Paris), minuteur systemd `prometheus-sauvegarde.timer` sur le serveur. Il lance le service Compose `backup` : image `prometheus-backup` construite en CI, même version que la production. Chaîne : `pg_dump` → `age` → dépôt B2.

**Vérification** : chaque matin, le workflow GitHub « Vérification des sauvegardes » prend la dernière sauvegarde. Il vérifie qu'elle a moins de 26 h, la déchiffre, la restaure dans un Postgres jetable et vérifie qu'elle contient des tables. Un échec déclenche un email de GitHub.

## Constats faits en testant (à ne pas oublier)

1. **Le modèle « Write Only » de Backblaze inclut le droit d'effacer** (`deleteFiles`) et de modifier les règles du bucket. Une clé « dépôt seul » n'existe pas dans l'interface. C'est l'Object Lock qui protège les sauvegardes, pas la clé.
2. **Activer l'Object Lock ne suffit pas** : tant que la rétention par défaut n'est pas enregistrée, les fichiers ne sont pas verrouillés. Vérifié par un test : effacement accepté avant réglage, refusé (`access_denied`) après.
3. **`pg_dump` passe par la connexion directe** de Neon (adresse sans `-pooler`, déduite automatiquement) : le pooler ne garantit pas une session unique pendant toute la copie.

## Options écartées

- **Cloudflare R2** : carte bancaire exigée.
- **Chiffrement symétrique (mot de passe sur le serveur)** : un pirate du serveur pourrait relire toutes les sauvegardes.
- **Sauvegarde lancée par GitHub Actions** : il faudrait confier l'adresse de la base de production à GitHub. Le serveur l'a déjà.
- **Mode Compliance** : aucune échappatoire, même pour purger une sauvegarde sur demande d'effacement d'un candidat.

## Conséquences

- **Le dépôt est public, les journaux de GitHub Actions aussi** : les scripts de vérification n'affichent que des noms de fichiers, des tailles et des comptages, jamais une donnée.
- Une donnée effacée de la base reste jusqu'à 31 jours dans les sauvegardes : à mentionner dans la politique de confidentialité.
- **Perte de la clé secrète = sauvegardes illisibles.** Elle doit rester dans le gestionnaire de mots de passe.
- GitHub désactive les workflows programmés d'un dépôt public après 60 jours sans activité : en cas de pause prolongée, le réactiver dans l'onglet Actions.
- Critère de réexamen : base au-delà de ~5 Go (limite gratuite), ou exigence client de sauvegarde multi-région.
