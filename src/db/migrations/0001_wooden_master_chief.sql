CREATE TABLE "ai365_users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"email" varchar(150) NOT NULL,
	"mobile" varchar(15) NOT NULL,
	"password" varchar(255) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "ai365_users_email_unique" UNIQUE("email"),
	CONSTRAINT "ai365_users_mobile_unique" UNIQUE("mobile")
);
