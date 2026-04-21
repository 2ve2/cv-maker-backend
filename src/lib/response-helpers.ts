import type { Context } from "hono";

/**
 * Standard API response format
 */
export interface ApiResponse<T = unknown> {
	status: boolean;
	message?: string;
	result?: T;
	error?: string;
	code?: string;
}

/**
 * Success response helper
 */
export function successResponse<T>(
	c: Context,
	result: T,
	message?: string,
	statusCode: number = 200,
): Response {
	const response: ApiResponse<T> = {
		status: true,
		result,
	};

	if (message) {
		response.message = message;
	}

	return c.json(response, statusCode as any);
}

/**
 * Error response helper
 */
export function errorResponse(
	c: Context,
	error: string,
	statusCode: number = 400,
	code?: string,
): Response {
	const response: ApiResponse = {
		status: false,
		error,
	};

	if (code) {
		response.code = code;
	}

	return c.json(response, statusCode as any);
}

/**
 * Validation error response helper
 */
export function validationErrorResponse(c: Context, message: string, field?: string): Response {
	const response: ApiResponse = {
		status: false,
		error: "Validation failed",
		message,
		code: "VALIDATION_ERROR",
	};

	if (field) {
		response.code = `VALIDATION_ERROR_${field.toUpperCase()}`;
		(response as ApiResponse & { field?: string }).field = field;
	}

	return c.json(response, 400);
}

/**
 * Conflict response helper (for duplicate resources)
 */
export function conflictResponse(
	c: Context,
	message: string = "Resource already exists",
): Response {
	return errorResponse(c, message, 409, "CONFLICT");
}

/**
 * Internal server error response helper
 */
export function internalErrorResponse(
	c: Context,
	message: string = "Internal server error",
): Response {
	return errorResponse(c, message, 500, "INTERNAL_ERROR");
}

/**
 * Database error response helper
 */
export function databaseErrorResponse(c: Context, error: unknown): Response {
	// Handle specific database errors
	if (typeof error === "object" && error !== null && "code" in error) {
		const dbError = error as { code: string; constraint?: string; detail?: string };

		switch (dbError.code) {
			case "23505": // Unique constraint violation
				if (dbError.constraint?.includes("title")) {
					return conflictResponse(c, "A project with this title already exists");
				}
				return conflictResponse(c, "Resource already exists");

			case "23503": // Foreign key constraint violation
				return errorResponse(c, "Referenced resource not found", 400, "INVALID_REFERENCE");

			case "23502": // Not null constraint violation
				return validationErrorResponse(c, "Required field is missing");

			case "23514": // Check constraint violation
				return validationErrorResponse(c, "Data validation failed");

			default:
				console.error("Database error:", error);
				return internalErrorResponse(c, "Database operation failed");
		}
	}

	// Handle other error types
	if (error instanceof Error) {
		console.error("Database error:", error.message);
		return internalErrorResponse(c, "Database operation failed");
	}

	console.error("Unknown database error:", error);
	return internalErrorResponse(c, "Database operation failed");
}
