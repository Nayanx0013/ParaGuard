import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { Redis } from '@upstash/redis';
import { Ratelimit } from '@upstash/ratelimit';

const UPSTASH_URL = process.env.UPSTASH_REDIS_REST_URL;
const UPSTASH_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

const distributedRatelimit =
  UPSTASH_URL && UPSTASH_TOKEN
    ? new Ratelimit({
        redis: new Redis({
          url: UPSTASH_URL,
          token: UPSTASH_TOKEN,
        }),
        limiter: Ratelimit.slidingWindow(20, '1 m'),
        analytics: true,
        prefix: 'plagiarism-tool:api',
      })
    : null;

// Bounded fallback in-memory limiter for local development.
const rateLimitMap = new Map<string, { count: number; timestamp: number }>();
const WINDOW_IN_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS = 20; // Max requests per window
const MAX_IN_MEMORY_KEYS = 2000;

function applyInMemoryRateLimit(ip: string): { allowed: boolean; remaining: number; reset: number } {
  const now = Date.now();
  const existing = rateLimitMap.get(ip);

  if (existing && now - existing.timestamp < WINDOW_IN_MS) {
    if (existing.count >= MAX_REQUESTS) {
      return {
        allowed: false,
        remaining: 0,
        reset: Math.ceil((existing.timestamp + WINDOW_IN_MS) / 1000),
      };
    }

    existing.count++;
    return {
      allowed: true,
      remaining: Math.max(MAX_REQUESTS - existing.count, 0),
      reset: Math.ceil((existing.timestamp + WINDOW_IN_MS) / 1000),
    };
  }

  rateLimitMap.set(ip, { count: 1, timestamp: now });

  if (rateLimitMap.size > MAX_IN_MEMORY_KEYS) {
    const cutoff = now - WINDOW_IN_MS;
    for (const [key, value] of rateLimitMap.entries()) {
      if (value.timestamp < cutoff) {
        rateLimitMap.delete(key);
      }
    }
  }

  return {
    allowed: true,
    remaining: MAX_REQUESTS - 1,
    reset: Math.ceil((now + WINDOW_IN_MS) / 1000),
  };
}

export async function proxy(request: NextRequest) {
  // Only apply rate limiting to the paraphrase and plagiarism API endpoints
  if (
    request.nextUrl.pathname.startsWith('/api/paraphrase') ||
    request.nextUrl.pathname.startsWith('/api/plagiarism-check')
  ) {
    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      request.headers.get('x-real-ip') ||
      'anonymous_ip';

    if (distributedRatelimit) {
      const result = await distributedRatelimit.limit(ip);

      if (!result.success) {
        return new NextResponse(
          JSON.stringify({ error: 'Too many requests. Please try again later.' }),
          {
            status: 429,
            headers: {
              'Content-Type': 'application/json',
              'X-RateLimit-Limit': String(result.limit),
              'X-RateLimit-Remaining': String(result.remaining),
              'X-RateLimit-Reset': String(result.reset),
            },
          }
        );
      }

      const response = NextResponse.next();
      response.headers.set('X-RateLimit-Limit', String(result.limit));
      response.headers.set('X-RateLimit-Remaining', String(result.remaining));
      response.headers.set('X-RateLimit-Reset', String(result.reset));
      return response;
    }

    const fallbackResult = applyInMemoryRateLimit(ip);

    if (!fallbackResult.allowed) {
      return new NextResponse(
        JSON.stringify({ error: 'Too many requests. Please try again later.' }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'X-RateLimit-Limit': String(MAX_REQUESTS),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': String(fallbackResult.reset),
          },
        }
      );
    } else {
      const response = NextResponse.next();
      response.headers.set('X-RateLimit-Limit', String(MAX_REQUESTS));
      response.headers.set('X-RateLimit-Remaining', String(fallbackResult.remaining));
      response.headers.set('X-RateLimit-Reset', String(fallbackResult.reset));
      return response;
    }
  }

  // Continue to the intended route
  return NextResponse.next();
}

// Ensure the middleware only runs for specific paths
export const config = {
  matcher: ['/api/:path*'],
};
