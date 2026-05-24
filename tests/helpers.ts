import { vi, expect } from 'vitest';
import type { Mock } from 'vitest';
import { NextResponse } from 'next/server';

export type Role = 'PATIENT' | 'DOCTOR' | 'NURSE' | 'RECEPTIONIST' | 'ADMIN';

type SessionInput = {
  id?: string;
  role: Role;
  name?: string;
  email?: string;
};

/**
 * Set the mocked `getServerSession` to resolve with a session for the given role,
 * or with `null` to simulate an unauthenticated request.
 */
export function setSession(getServerSession: Mock, input: SessionInput | null) {
  if (input === null) {
    getServerSession.mockResolvedValue(null);
    return;
  }
  getServerSession.mockResolvedValue({
    user: {
      id: input.id ?? 'user-1',
      name: input.name ?? 'Test User',
      email: input.email ?? 'test@example.com',
      role: input.role,
    },
    expires: new Date(Date.now() + 3_600_000).toISOString(),
  });
}

/**
 * Build a standard Web `Request` for handler invocation.
 */
export function makeRequest(opts: {
  url?: string;
  method?: string;
  body?: unknown;
  searchParams?: Record<string, string>;
} = {}): Request {
  const url = new URL(opts.url ?? 'http://localhost/api/test');
  for (const [k, v] of Object.entries(opts.searchParams ?? {})) {
    url.searchParams.set(k, v);
  }
  return new Request(url, {
    method: opts.method ?? 'GET',
    headers: { 'Content-Type': 'application/json' },
    body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
  });
}

/**
 * Wrap params in the shape Next.js 15 expects for dynamic segments.
 */
export function withParams<T extends Record<string, string>>(params: T) {
  return { params: Promise.resolve(params) };
}

/** Assert a Response has the given status and parse its JSON body. */
export async function expectJson(res: Response, status: number) {
  expect(res.status).toBe(status);
  return res.json();
}

type RbacInput =
  | { authorized: true; role: Role; id?: string; name?: string }
  | { authorized: false; status?: 401 | 403; message?: string };

/**
 * Configure the mocked `requireRole(...)` return value for the next call.
 * `requireRole` must already be vi.mock'd in the test file.
 */
export function setRbac(requireRole: Mock, input: RbacInput) {
  if (input.authorized) {
    requireRole.mockResolvedValue({
      authorized: true,
      session: {
        user: {
          id: input.id ?? 'user-1',
          name: input.name ?? 'Test User',
          email: 'test@example.com',
          role: input.role,
        },
        expires: new Date(Date.now() + 3_600_000).toISOString(),
      },
    });
    return;
  }
  const status = input.status ?? 403;
  const message = input.message ?? (status === 401 ? 'Unauthorized' : 'Forbidden');
  requireRole.mockResolvedValue({
    authorized: false,
    response: NextResponse.json({ error: message }, { status }),
  });
}
