-- Une personne n'appartient qu'à une seule agence en v1 (ADR-0017).
-- Garantie au niveau de la base, en plus des vérifications de l'application :
-- même un code qui oublierait la règle ne pourrait pas créer une seconde adhésion.
CREATE UNIQUE INDEX "member_user_id_unique" ON "member" USING btree ("user_id");
