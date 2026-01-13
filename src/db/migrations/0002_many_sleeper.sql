CREATE TABLE "subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"plan" varchar(50) NOT NULL,
	"status" varchar(20) DEFAULT 'active' NOT NULL,
	"price" numeric(10, 2) NOT NULL,
	"is_trial" boolean DEFAULT false NOT NULL,
	"start_date" timestamp with time zone DEFAULT now() NOT NULL,
	"end_date" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "ai365_users" ADD COLUMN "allow_login" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "ai365_users" ADD COLUMN "active" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_user_id_ai365_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."ai365_users"("id") ON DELETE cascade ON UPDATE cascade;