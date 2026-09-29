CREATE TABLE "candidat" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" text NOT NULL,
	"nom" text NOT NULL,
	"email" text NOT NULL,
	"type_poste" text NOT NULL,
	"statut" text DEFAULT 'invite' NOT NULL,
	"invite_par" text,
	"invite_le" timestamp with time zone DEFAULT now() NOT NULL,
	"commence_le" timestamp with time zone,
	"termine_le" timestamp with time zone,
	CONSTRAINT "candidat_statut_valide" CHECK ("candidat"."statut" in ('invite', 'en_cours', 'termine'))
);
--> statement-breakpoint
CREATE TABLE "jeton_candidat" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"candidat_id" uuid NOT NULL,
	"empreinte" text NOT NULL,
	"expire_le" timestamp with time zone NOT NULL,
	"utilise_le" timestamp with time zone,
	"revoque_le" timestamp with time zone,
	"cree_le" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "jeton_candidat_empreinte_unique" UNIQUE("empreinte")
);
--> statement-breakpoint
CREATE TABLE "quota_agence" (
	"organization_id" text PRIMARY KEY NOT NULL,
	"utilisees" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session_candidat" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"candidat_id" uuid NOT NULL,
	"empreinte" text NOT NULL,
	"expire_le" timestamp with time zone NOT NULL,
	"revoque_le" timestamp with time zone,
	"cree_le" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "session_candidat_empreinte_unique" UNIQUE("empreinte")
);
--> statement-breakpoint
ALTER TABLE "candidat" ADD CONSTRAINT "candidat_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "candidat" ADD CONSTRAINT "candidat_invite_par_user_id_fk" FOREIGN KEY ("invite_par") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "jeton_candidat" ADD CONSTRAINT "jeton_candidat_candidat_id_candidat_id_fk" FOREIGN KEY ("candidat_id") REFERENCES "public"."candidat"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "quota_agence" ADD CONSTRAINT "quota_agence_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session_candidat" ADD CONSTRAINT "session_candidat_candidat_id_candidat_id_fk" FOREIGN KEY ("candidat_id") REFERENCES "public"."candidat"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "candidat_organization_invite_idx" ON "candidat" USING btree ("organization_id","invite_le");--> statement-breakpoint
CREATE INDEX "jeton_candidat_candidat_idx" ON "jeton_candidat" USING btree ("candidat_id");--> statement-breakpoint
CREATE INDEX "session_candidat_candidat_idx" ON "session_candidat" USING btree ("candidat_id");