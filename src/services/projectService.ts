import { db } from "@/db";
import { project } from "@/db/schema/project";
import { ProjectCreate, ProjectQuery } from "@/types/schemas";
import { createId } from "@paralleldrive/cuid2";
import { and, asc, desc, eq, ilike, sql, SQL } from "drizzle-orm";
import { HTTPException } from "hono/http-exception";

class ProjectService {
  private buildWhereConditions(query: ProjectQuery) {
    const { qTitle } = query;

    return and(
      qTitle ? ilike(project.title, `%${qTitle.trim()}%`) : undefined,
    );
  }

  private buildPagination(total: number, query: ProjectQuery) {
    const { limit, offset } = query;

    return {
      total,
      limit,
      offset,
      hasMore: offset + limit < total,
    };
  }

  private async fetchProjectsAndCount(
    query: ProjectQuery,
    whereConditions: SQL<unknown> | undefined,
  ) {
    const { limit, offset, order } = query;

    return await Promise.all([
      db
        .select({
          id: project.id,
          title: project.title,
          content: project.content,
          createdAt: project.createdAt,
        })
        .from(project)
        .where(whereConditions)
        .orderBy(order === "asc" ? asc(project.createdAt) : desc(project.createdAt))
        .limit(limit)
        .offset(offset),

      db
        .select({ count: sql<number>`count(*)` })
        .from(project)
        .where(whereConditions)
        .then((result) => Number(result[0]?.count) || 0)
    ]);
  }

  async getAllProjects(query: ProjectQuery) {
    const whereConditions = this.buildWhereConditions(query);
    const [projectsData, totalCount] = await this.fetchProjectsAndCount(query, whereConditions);

    return {
      projects: projectsData,
      pagination: this.buildPagination(totalCount, query),
    };
  }

  async getProjectById(id: string) {
    const result = await db
      .select({
        id: project.id,
        title: project.title,
        content: project.content,
        createdAt: project.createdAt,
      })
      .from(project)
      .where(eq(project.id, id))
      .limit(1);

    if (!result.length) {
      throw new HTTPException(404, { message: "Project not found" });
    }

    return result[0];
  }

  async createProject(data: ProjectCreate) {
    const projectData = {
      id: createId(),
      title: data.title.trim(),
      content: data.content,
      createdAt: new Date(),
    } satisfies typeof project.$inferInsert;

    await db.insert(project).values(projectData);

    return projectData;
  }
}


export const projectService = new ProjectService();
