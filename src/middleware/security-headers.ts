/**
 * Security headers middleware
 * Adds security headers to all responses for defense in depth
 */

import type { Context, Next } from "hono";

/**
 * Security headers middleware
 * Adds essential security headers to protect against common attacks
 */
export const securityHeadersMiddleware = async (c: Context, next: Next) => {
	// Prevent MIME type sniffing
	c.header("X-Content-Type-Options", "nosniff");

	// Prevent clickjacking attacks
	c.header("X-Frame-Options", "DENY");

	// Enable XSS protection (legacy browsers)
	c.header("X-XSS-Protection", "1; mode=block");

	// Enforce HTTPS (only in production)
	if (process.env.NODE_ENV === "production") {
		c.header("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload");
	}

	// Referrer policy - limit referrer information
	c.header("Referrer-Policy", "strict-origin-when-cross-origin");

	// Content Security Policy - basic policy for API
	c.header("Content-Security-Policy", "default-src 'none'; frame-ancestors 'none';");

	// Permissions policy - disable unnecessary browser features
	c.header("Permissions-Policy", "geolocation=(), microphone=(), camera=()");

	// Remove server information
	c.header("Server", "");

  await next();
};
