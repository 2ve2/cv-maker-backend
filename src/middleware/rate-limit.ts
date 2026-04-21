/**
 * Rate limiting middleware
 * Implements sliding window rate limiting to prevent abuse
 */

import type { Context, Next } from "hono";
import { HTTPException } from "hono/http-exception";

interface RateLimitEntry {
	requests: number[];
	windowStart: number;
}

interface RateLimitOptions {
	windowMs: number;
	maxRequests: number;
	message?: string;
}

class RateLimiter {
	private store = new Map<string, RateLimitEntry>();
	private cleanupInterval: NodeJS.Timeout;
	private maxEntries = 10000;

	constructor(public options: RateLimitOptions) {
		this.cleanupInterval = setInterval(() => this.cleanup(), 60000);
	}

	private cleanup() {
		const now = Date.now();
		const cutoff = now - this.options.windowMs;

		if (this.store.size > this.maxEntries) {
			const entriesToDelete = this.store.size - this.maxEntries + 1000;
			let deleted = 0;

			for (const [key, entry] of this.store.entries()) {
				if (deleted >= entriesToDelete) break;
				if (entry.windowStart < cutoff - this.options.windowMs) {
					this.store.delete(key);
					deleted++;
				}
			}
		}

		for (const [key, entry] of this.store.entries()) {
			entry.requests = entry.requests.filter((timestamp) => timestamp > cutoff);
			if (entry.requests.length === 0) {
				this.store.delete(key);
			}
		}
	}

	private getClientId(c: Context): string {
		const cfConnectingIp = c.req.header("cf-connecting-ip");
		const forwarded = c.req.header("x-forwarded-for");
		const realIp = c.req.header("x-real-ip");
		let clientId: string;

		if (cfConnectingIp) {
			clientId = cfConnectingIp;
		} else if (forwarded) {
			clientId = forwarded.split(",")[0].trim();
		} else if (realIp) {
			clientId = realIp;
		} else {
			try {
				const url = new URL(c.req.url);
				clientId = (url.hostname && url.hostname !== "localhost") ? url.hostname : "127.0.0.1";
			} catch {
				clientId = "127.0.0.1";
			}
		}

		// Hash to prevent memory exhaustion from too many unique keys
		let hash = 0;
		for (let i = 0; i < clientId.length; i++) {
			hash = ((hash << 5) - hash + clientId.charCodeAt(i)) & hash;
		}
		return Math.abs(hash).toString();
	}

	checkLimit(c: Context): boolean {
		const clientId = this.getClientId(c);
		const now = Date.now();
		const windowStart = now - this.options.windowMs;

		let entry = this.store.get(clientId);
		if (!entry) {
			entry = { requests: [], windowStart: now };
			this.store.set(clientId, entry);
		}

		entry.requests = entry.requests.filter((timestamp) => timestamp > windowStart);

		if (entry.requests.length >= this.options.maxRequests) {
			return false;
		}

		entry.requests.push(now);
		return true;
	}

	destroy() {
		clearInterval(this.cleanupInterval);
		this.store.clear();
	}
}

const rateLimiter = new RateLimiter({
	windowMs: 15 * 60 * 1000, // 15 minutes
	maxRequests: process.env.NODE_ENV === "test" ? 2000 : 500,
	message: "Too many requests. Please try again later.",
});

export const rateLimitMiddleware = async (c: Context, next: Next) => {
	if (!rateLimiter.checkLimit(c)) {
		throw new HTTPException(429, { message: rateLimiter.options.message });
	}
	await next();
};

// Graceful shutdown
process.on("SIGTERM", () => rateLimiter.destroy());
process.on("SIGINT", () => rateLimiter.destroy());
