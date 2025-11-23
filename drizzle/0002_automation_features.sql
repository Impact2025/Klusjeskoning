-- Automation Features Migration
--> statement-breakpoint
CREATE TYPE "public"."payout_day" AS ENUM('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday');--> statement-breakpoint
CREATE TYPE "public"."recurrence_type" AS ENUM('none', 'daily', 'weekly', 'custom');--> statement-breakpoint

--> statement-breakpoint
ALTER TABLE "chores" ADD COLUMN "recurrence_type" "recurrence_type" DEFAULT 'none' NOT NULL;--> statement-breakpoint
ALTER TABLE "chores" ADD COLUMN "recurrence_days" text;--> statement-breakpoint
ALTER TABLE "chores" ADD COLUMN "is_template" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "chores" ADD COLUMN "template_id" uuid;--> statement-breakpoint
ALTER TABLE "chores" ADD COLUMN "next_due_date" timestamp with time zone;--> statement-breakpoint

--> statement-breakpoint
CREATE TABLE "automation_settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"family_id" uuid NOT NULL,
	"auto_payout_enabled" integer DEFAULT 1 NOT NULL,
	"payout_day" "payout_day" DEFAULT 'friday' NOT NULL,
	"payout_time" varchar(5) DEFAULT '19:00' NOT NULL,
	"approval_window_enabled" integer DEFAULT 0 NOT NULL,
	"approval_window_start" varchar(5),
	"approval_window_end" varchar(5),
	"last_payout_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint

--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"family_id" uuid NOT NULL,
	"child_id" uuid,
	"type" varchar(50) NOT NULL,
	"title" varchar(255) NOT NULL,
	"message" text NOT NULL,
	"data" text,
	"is_read" integer DEFAULT 0 NOT NULL,
	"scheduled_for" timestamp with time zone,
	"sent_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint

--> statement-breakpoint
ALTER TABLE "automation_settings" ADD CONSTRAINT "automation_settings_family_id_families_id_fk" FOREIGN KEY ("family_id") REFERENCES "public"."families"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "chores" ADD CONSTRAINT "chores_template_id_chores_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."chores"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_family_id_families_id_fk" FOREIGN KEY ("family_id") REFERENCES "public"."families"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_child_id_children_id_fk" FOREIGN KEY ("child_id") REFERENCES "public"."children"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint