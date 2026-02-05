CREATE TABLE "ai365_payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"txnid" uuid NOT NULL,
	"paln" varchar(15) NOT NULL,
	"price" numeric(10, 2) NOT NULL,
	"user_id" uuid NOT NULL,
	"name" varchar(255) NOT NULL,
	"email" varchar(150) NOT NULL,
	"phone" varchar(15) NOT NULL,
	"status" varchar(15) NOT NULL,
	"mode" varchar(25),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
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
CREATE TABLE "ai365_temp_users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"email" varchar(150) NOT NULL,
	"mobile" varchar(15) NOT NULL,
	"password" varchar(255) NOT NULL,
	"allow_login" boolean DEFAULT false NOT NULL,
	"active" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "ai365_temp_users_email_unique" UNIQUE("email"),
	CONSTRAINT "ai365_temp_users_mobile_unique" UNIQUE("mobile")
);
--> statement-breakpoint
CREATE TABLE "ai365_users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"email" varchar(150) NOT NULL,
	"mobile" varchar(15) NOT NULL,
	"password" varchar(255) NOT NULL,
	"allow_login" boolean DEFAULT false NOT NULL,
	"active" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "ai365_users_email_unique" UNIQUE("email"),
	CONSTRAINT "ai365_users_mobile_unique" UNIQUE("mobile")
);
--> statement-breakpoint
CREATE TABLE "ai365_videos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"video" varchar(255) NOT NULL,
	"status" varchar(255) NOT NULL,
	"publish_at" timestamp with time zone DEFAULT now() NOT NULL,
	"demo" boolean DEFAULT false,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "registration" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"email" varchar(150) NOT NULL,
	"mobile" varchar(15) NOT NULL,
	"course" varchar(200) NOT NULL,
	"campaign" varchar(200) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"email" varchar(150) NOT NULL,
	"mobile" varchar(15) NOT NULL,
	"password" varchar(255) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email"),
	CONSTRAINT "users_mobile_unique" UNIQUE("mobile")
);
--> statement-breakpoint
ALTER TABLE "ai365_payments" ADD CONSTRAINT "ai365_payments_user_id_ai365_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."ai365_users"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_user_id_ai365_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."ai365_users"("id") ON DELETE cascade ON UPDATE cascade;