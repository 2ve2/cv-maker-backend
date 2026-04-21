CREATE TABLE "project" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"content" jsonb NOT NULL,
	"created_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE INDEX "idx_project_created_at" ON "project" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "idx_project_title" ON "project" USING btree ("title");