CREATE TYPE "public"."email_status" AS ENUM('sent', 'delivered', 'bounced', 'complained', 'failed');--> statement-breakpoint


CREATE TABLE "email_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email_id" text,
	"recipient" text NOT NULL,
	"template_type" text,
	"subject" text NOT NULL,
	"status" "email_status" DEFAULT 'sent',
	"provider" text,
	"metadata" jsonb,
	"sent_at" timestamp DEFAULT now() NOT NULL,
	"delivered_at" timestamp,
	"failed_at" timestamp,
	"error_message" text,
	CONSTRAINT "email_logs_email_id_unique" UNIQUE("email_id")
);
