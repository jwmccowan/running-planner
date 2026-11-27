CREATE TABLE "activities" (
	"plan_id" text NOT NULL,
	"id" text NOT NULL,
	"date" date NOT NULL,
	"type" text NOT NULL,
	"run_type" text,
	"name" text NOT NULL,
	"distance" double precision NOT NULL,
	"intense_distance" double precision NOT NULL,
	"status" text,
	CONSTRAINT "activities_plan_id_id_pk" PRIMARY KEY("plan_id","id"),
	CONSTRAINT "activities_type" CHECK ("activities"."type" in ('run', 'gym')),
	CONSTRAINT "activities_run_type" CHECK (("activities"."type" = 'run') = ("activities"."run_type" is not null)),
	CONSTRAINT "activities_status" CHECK ("activities"."status" is null or "activities"."status" in ('completed', 'missed')),
	CONSTRAINT "activities_intense_within_distance" CHECK ("activities"."intense_distance" <= "activities"."distance")
);
--> statement-breakpoint
CREATE TABLE "plans" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"start_date" date NOT NULL,
	"week_count" integer NOT NULL,
	"prior_weekly_distances" double precision[] DEFAULT '{}' NOT NULL,
	"block_starts" date[] DEFAULT '{}' NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "plans_week_count_positive" CHECK ("plans"."week_count" >= 1),
	CONSTRAINT "plans_start_date_monday" CHECK (extract(isodow from "plans"."start_date") = 1)
);
--> statement-breakpoint
ALTER TABLE "activities" ADD CONSTRAINT "activities_plan_id_plans_id_fk" FOREIGN KEY ("plan_id") REFERENCES "public"."plans"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "activities_plan_id_date_idx" ON "activities" USING btree ("plan_id","date");