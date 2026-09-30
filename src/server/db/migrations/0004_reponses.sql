CREATE TABLE "reponse_candidat" (
	"candidat_id" uuid NOT NULL,
	"numero" integer NOT NULL,
	"valeur" smallint NOT NULL,
	"repondu_le" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "reponse_candidat_candidat_id_numero_pk" PRIMARY KEY("candidat_id","numero"),
	CONSTRAINT "reponse_valeur_valide" CHECK ("reponse_candidat"."valeur" between 1 and 5)
);
--> statement-breakpoint
ALTER TABLE "candidat" ADD COLUMN "information_lue_le" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "candidat" ADD COLUMN "resultats" jsonb;--> statement-breakpoint
ALTER TABLE "reponse_candidat" ADD CONSTRAINT "reponse_candidat_candidat_id_candidat_id_fk" FOREIGN KEY ("candidat_id") REFERENCES "public"."candidat"("id") ON DELETE cascade ON UPDATE no action;