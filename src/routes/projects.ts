import { successResponse } from "@/lib/response-helpers";
import { projectService } from "@/services/projectService";
import { ProjectCreateSchema, ProjectQuerySchema } from "@/types/schemas";
import { Hono } from "hono";

const app = new Hono();

/**
 * GET all projects with pagination and filters
 */
app.get("/", async (c) => {
  const query = ProjectQuerySchema.parse({
    limit: c.req.query("limit"),
    offset: c.req.query("offset"),
    order: c.req.query("order"),
    qTitle: c.req.query("qTitle"),
  });

  const result = await projectService.getAllProjects(query);
  return successResponse(c, result);
});

/**
 * GET project by ID
 */
app.get("/:id", async (c) => {
  const id = c.req.param("id");
  const result = await projectService.getProjectById(id);
  return successResponse(c, { project: result });
});

/**
 * POST create a new project
 */
app.post("/", async (c) => {
  const body = await c.req.json();
  const validatedData = ProjectCreateSchema.parse(body);

  const newProject = await projectService.createProject(validatedData);

  return successResponse(c, { project: newProject }, "Project created successfully", 201);
});

export { app as projectsRoutes };
