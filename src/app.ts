import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { databaseErrorResponse, errorResponse, internalErrorResponse, successResponse, validationErrorResponse } from "./lib/response-helpers";
import { ZodError } from "zod";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { prettyJSON } from "hono/pretty-json";
import { securityHeadersMiddleware } from "./middleware/security-headers";
import { payloadLimitMiddleware } from "./middleware/payload-limit";
import { rateLimitMiddleware } from "./middleware/rate-limit";
import { projectsRoutes } from "./routes/projects";


const app = new Hono();

// Error handler using Hono's onError
app.onError((error, c) => {
  console.error(error);

  // Handle HTTP exceptions (thrown by our application)
  if (error instanceof HTTPException) {
    return errorResponse(c, error.message, error.status);
  }

  // Handle Zod validation errors
  if (error instanceof ZodError) {
    const firstError = error.issues[0];
    const fieldName = firstError.path.join(".");
    const message = firstError.message;

    return validationErrorResponse(c, message, fieldName);
  }
  // Handle database errors
  if (error instanceof Error) {
    // Check for specific database error patterns first
    if ("code" in error && typeof error.code === "string") {
      return databaseErrorResponse(c, error);
    }

    // Check if it's a database error by looking at the error message or stack
    if (
      error.message.includes("duplicate key value violates unique constraint") ||
      error.message.includes("violates foreign key constraint") ||
      error.message.includes("violates not-null constraint") ||
      error.message.includes("violates check constraint") ||
      error.name === "NeonDbError" ||
      error.constructor.name === "NeonDbError"
    ) {
      return databaseErrorResponse(c, error);
    }
  }
  // Default to internal server error
  return internalErrorResponse(c, "An unexpected error occurred");
});

/**
 * Middlewares
 */
app.use('*', cors({
  origin: ['http://localhost:3000', 'http://192.168.8.173:5174', 'http://192.168.8.173:5176', 'http://192.168.8.173:5173'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type'],
}))
app.use("*", logger());
app.use("*", prettyJSON());
app.use("*", securityHeadersMiddleware);

/**
 * Payload size limits
 */
app.use("/api/*", payloadLimitMiddleware)

/**
 * Projects rate limiting
 */
app.use("/api/projects/*", rateLimitMiddleware);

/**
 * Routes
 */
app.route("/api/projects", projectsRoutes);

/**
 * Check system status
 */
app.get("/", (c) => successResponse(c, { timestamp: new Date().toISOString() }, "API is running"));

export default app;
