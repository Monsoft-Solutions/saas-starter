CREATE INDEX "idx_invitation_org" ON "invitation" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "idx_invitation_org_email_pending" ON "invitation" USING btree ("organization_id",lower("email")) WHERE "invitation"."status" = 'pending';--> statement-breakpoint
CREATE INDEX "idx_invitation_expires_at" ON "invitation" USING btree ("expires_at");