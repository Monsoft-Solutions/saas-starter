CREATE TABLE "admin_statistics" (
	"id" serial PRIMARY KEY NOT NULL,
	"total_users" integer NOT NULL,
	"active_users_last_30_days" integer NOT NULL,
	"new_users_last_30_days" integer NOT NULL,
	"total_organizations" integer NOT NULL,
	"organizations_with_subscriptions" integer NOT NULL,
	"total_mrr" real NOT NULL,
	"total_active_subscriptions" integer NOT NULL,
	"trial_organizations" integer NOT NULL,
	"user_growth_rate" real,
	"revenue_growth_rate" real,
	"churn_rate" real,
	"calculated_at" timestamp DEFAULT now() NOT NULL,
	"calculation_duration_ms" integer,
	"metadata" text
);
--> statement-breakpoint
DROP INDEX "idx_invitation_org";--> statement-breakpoint
DROP INDEX "idx_invitation_org_email_pending";--> statement-breakpoint
DROP INDEX "idx_invitation_expires_at";