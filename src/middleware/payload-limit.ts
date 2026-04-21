/**
 * Payload size limiting middleware
 * Prevents DoS attacks through large request payloads
 */

import type { Context, Next } from "hono";
import { HTTPException } from "hono/http-exception";

const MAX_PAYLOAD_SIZE = 2 * 1024 * 1024; // 2MB

function getClientIp(c: Context): string {
	const forwarded = c.req.header("x-forwarded-for");
	const realIp = c.req.header("x-real-ip");

	if (forwarded) return forwarded.split(",")[0].trim();
	if (realIp) return realIp;
	return "unknown";
}

function formatBytes(bytes: number): string {
	if (bytes === 0) return "0 Bytes";
	const k = 1024;
	const sizes = ["Bytes", "KB", "MB", "GB"];
	const i = Math.floor(Math.log(bytes) / Math.log(k));
	return `${parseFloat((bytes / k ** i).toFixed(2))} ${sizes[i]}`;
}

export const payloadLimitMiddleware = async (c: Context, next: Next) => {
	const contentLength = c.req.header("content-length");

	if (contentLength) {
		const size = parseInt(contentLength, 10);

		if (Number.isNaN(size)) {
			throw new HTTPException(400, { message: "Invalid Content-Length header" });
		}

		if (size > MAX_PAYLOAD_SIZE) {
			console.warn(`Large payload attempt: ${size} bytes from IP: ${getClientIp(c)}`);
			throw new HTTPException(413, {
				message: `Payload too large. Maximum size is ${formatBytes(MAX_PAYLOAD_SIZE)}.`,
			});
		}
	}

	// Fallback for chunked transfers or missing Content-Length
	const _originalJson = c.req.json;
	c.req.json = async () => {
		try {
			const text = await c.req.text();
			const size = new TextEncoder().encode(text).length;

			if (size > MAX_PAYLOAD_SIZE) {
				console.warn(`Large payload attempt (no Content-Length): ${size} bytes from IP: ${getClientIp(c)}`);
				throw new HTTPException(413, {
					message: `Payload too large. Maximum size is ${formatBytes(MAX_PAYLOAD_SIZE)}.`,
				});
			}

			return JSON.parse(text);
		} catch (error) {
			if (error instanceof HTTPException) throw error;
			throw new HTTPException(400, { message: "Invalid JSON" });
		}
	};

	await next();
};
