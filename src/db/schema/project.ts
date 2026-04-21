import { index, jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const project = pgTable(
  "project",
  {
    id: text("id").primaryKey(),
    title: text("title").notNull(),
    content: jsonb("content").notNull(),
    createdAt: timestamp("created_at")
    .$defaultFn(() => new Date())
    .notNull(),
  },
  (table) => [
    index("idx_project_created_at").on(table.createdAt),
    index("idx_project_title").on(table.title),
  ]
)
