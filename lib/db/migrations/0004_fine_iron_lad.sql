CREATE TABLE "job_executions" (
	"id" serial PRIMARY KEY NOT NULL,
	"job_id" varchar(255) NOT NULL,
	"job_type" varchar(100) NOT NULL,
	"status" varchar(50) NOT NULL,
	"payload" jsonb NOT NULL,
	"result" jsonb,
	"error" text,
	"retry_count" integer DEFAULT 0 NOT NULL,
	"user_id" integer,
	"organization_id" integer,
	"started_at" timestamp,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "job_executions_job_id_unique" UNIQUE("job_id")
);
