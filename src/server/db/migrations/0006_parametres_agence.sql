CREATE TABLE "parametres_agence" (
	"organization_id" text PRIMARY KEY NOT NULL,
	"conservation_mois" smallint DEFAULT 24 NOT NULL,
	"modifie_le" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "parametres_conservation_valide" CHECK ("parametres_agence"."conservation_mois" in (6, 12, 24))
);
--> statement-breakpoint
ALTER TABLE "parametres_agence" ADD CONSTRAINT "parametres_agence_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;