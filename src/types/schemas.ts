import { z } from "zod";

export const ProjectQuerySchema = z.object({
	limit: z.coerce.number().int().min(1).max(100).default(10),
	offset: z.coerce.number().int().min(0).default(0),
	order: z.enum(["asc", "desc"]).default("desc"),
	qTitle: z.string().optional(),
});

export type ProjectQuery = z.infer<typeof ProjectQuerySchema>;

export const ProjectCreateSchema = z.object({
  title: z.string().min(1, "Title is required").max(255, "Title too long"),
  content: z.record(z.string(), z.any(), { message: "Content must be a valid JSON object" }),
});

export type ProjectCreate = z.infer<typeof ProjectCreateSchema>;
