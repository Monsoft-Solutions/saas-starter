ALTER TABLE "job_executions" ALTER COLUMN "job_id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "job_executions" ALTER COLUMN "user_id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "job_executions" ALTER COLUMN "organization_id" SET DATA TYPE text;--> statement-breakpoint
CREATE INDEX "job_executions_job_type_idx" ON "job_executions" USING btree ("job_type");--> statement-breakpoint
CREATE INDEX "job_executions_status_idx" ON "job_executions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "job_executions_user_id_idx" ON "job_executions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "job_executions_organization_id_idx" ON "job_executions" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "job_executions_created_at_idx" ON "job_executions" USING btree ("created_at");