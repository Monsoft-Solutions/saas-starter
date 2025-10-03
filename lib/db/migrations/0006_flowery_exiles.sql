CREATE TYPE "public"."notification_category" AS ENUM('system', 'security', 'billing', 'team', 'activity', 'product');--> statement-breakpoint
CREATE TYPE "public"."notification_priority" AS ENUM('critical', 'important', 'info');--> statement-breakpoint
CREATE TYPE "public"."notification_type" AS ENUM('system.maintenance', 'system.update', 'security.password_changed', 'security.login_new_device', 'security.two_factor_enabled', 'billing.payment_success', 'billing.payment_failed', 'billing.subscription_created', 'billing.subscription_canceled', 'billing.trial_ending', 'team.invitation_received', 'team.invitation_accepted', 'team.member_added', 'team.member_removed', 'team.role_changed', 'activity.comment_mention', 'activity.task_assigned', 'product.feature_released', 'product.announcement');--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	"type" "notification_type" NOT NULL,
	"category" "notification_category" NOT NULL,
	"priority" "notification_priority" DEFAULT 'info' NOT NULL,
	"title" text NOT NULL,
	"message" text NOT NULL,
	"metadata" jsonb,
	"is_read" boolean DEFAULT false NOT NULL,
	"read_at" timestamp,
	"is_dismissed" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"expires_at" timestamp
);
--> statement-breakpoint
DROP INDEX "job_executions_job_type_idx";--> statement-breakpoint
DROP INDEX "job_executions_status_idx";--> statement-breakpoint
DROP INDEX "job_executions_user_id_idx";--> statement-breakpoint
DROP INDEX "job_executions_organization_id_idx";--> statement-breakpoint
DROP INDEX "job_executions_created_at_idx";--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_notifications_user_created" ON "notifications" USING btree ("user_id","created_at" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "idx_notifications_user_unread" ON "notifications" USING btree ("user_id","is_read") WHERE "notifications"."is_read" = false;--> statement-breakpoint
CREATE INDEX "idx_notifications_expires" ON "notifications" USING btree ("expires_at") WHERE "notifications"."expires_at" IS NOT NULL;