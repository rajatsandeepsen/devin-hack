CREATE TABLE "deliveries" (
	"id" text PRIMARY KEY,
	"category" text NOT NULL,
	"runId" varchar(255),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "monitors" (
	"category" text PRIMARY KEY,
	"monitorId" varchar(255) NOT NULL,
	"webhookSecret" text NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY,
	"language" text DEFAULT 'en-IN' NOT NULL,
	"subscriptions" text[] DEFAULT '{}'::text[] NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "deliveries_category_idx" ON "deliveries" ("category");--> statement-breakpoint
CREATE INDEX "users_subscriptions_idx" ON "users" USING gin ("subscriptions");--> statement-breakpoint
CREATE INDEX "users_language_idx" ON "users" ("language");