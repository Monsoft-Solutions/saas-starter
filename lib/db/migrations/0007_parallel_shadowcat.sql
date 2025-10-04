ALTER TABLE "activity_logs" DROP CONSTRAINT "activity_logs_user_id_user_id_fk";
--> statement-breakpoint
ALTER TABLE "activity_logs" ALTER COLUMN "user_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "activity_logs" ADD CONSTRAINT "activity_logs_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;