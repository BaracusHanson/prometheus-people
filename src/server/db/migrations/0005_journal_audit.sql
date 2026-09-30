CREATE TABLE "journal_audit" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" text NOT NULL,
	"user_id" text,
	"action" text NOT NULL,
	"candidat_id" uuid,
	"cree_le" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "journal_audit_action_valide" CHECK ("journal_audit"."action" in ('consultation', 'impression', 'suppression', 'purge'))
);
--> statement-breakpoint
ALTER TABLE "journal_audit" ADD CONSTRAINT "journal_audit_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "journal_audit" ADD CONSTRAINT "journal_audit_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "journal_audit" ADD CONSTRAINT "journal_audit_candidat_id_candidat_id_fk" FOREIGN KEY ("candidat_id") REFERENCES "public"."candidat"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "journal_audit_organization_cree_idx" ON "journal_audit" USING btree ("organization_id","cree_le");