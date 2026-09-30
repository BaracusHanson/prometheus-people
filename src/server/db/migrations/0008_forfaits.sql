ALTER TABLE "quota_agence" ADD COLUMN "forfait" text DEFAULT 'essai' NOT NULL;--> statement-breakpoint
ALTER TABLE "quota_agence" ADD COLUMN "mois" text;--> statement-breakpoint
ALTER TABLE "quota_agence" ADD COLUMN "utilisees_mois" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "quota_agence" ADD CONSTRAINT "quota_forfait_valide" CHECK ("quota_agence"."forfait" in ('essai', 'agence', 'agence_plus'));