import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from './route';
import prisma from '@/lib/db';
import bcrypt from 'bcrypt';
import { makeRequest, expectJson } from '@/tests/helpers';

vi.mock('@/lib/db', () => ({
  default: { patient: { findUnique: vi.fn(), create: vi.fn() } },
}));
vi.mock('bcrypt', () => ({ default: { hash: vi.fn() }, hash: vi.fn() }));

const baseBody = {
  firstName: 'John',
  lastName: 'Doe',
  email: 'john@example.com',
  phone: '555-0100',
  dob: '1990-01-01',
  password: 'password123',
};

describe('POST /api/auth/signup', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 400 when required fields are missing', async () => {
    const body = await expectJson(
      await POST(makeRequest({ method: 'POST', body: { email: 'a@b.c' } })),
      400,
    );
    expect(body).toEqual({ error: 'Missing required fields' });
  });

  it('returns 400 when the email is already registered', async () => {
    vi.mocked(prisma.patient.findUnique).mockResolvedValue({ id: 'p-existing' } as any);
    const body = await expectJson(
      await POST(makeRequest({ method: 'POST', body: baseBody })),
      400,
    );
    expect(body).toEqual({ error: 'Email already exists' });
  });

  it('creates a patient with a hashed password and strips it from the response', async () => {
    vi.mocked(prisma.patient.findUnique).mockResolvedValue(null);
    (bcrypt.hash as any).mockResolvedValue('HASHED');
    vi.mocked(prisma.patient.create).mockResolvedValue({
      id: 'p-1',
      firstName: 'John',
      lastName: 'Doe',
      email: baseBody.email,
      phone: '555-0100',
      dob: new Date('1990-01-01'),
      password: 'HASHED',
    } as any);

    const res = await POST(makeRequest({ method: 'POST', body: baseBody }));
    const body = await expectJson(res, 201);

    expect(bcrypt.hash).toHaveBeenCalledWith('password123', 10);
    expect(prisma.patient.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        firstName: 'John',
        lastName: 'Doe',
        email: baseBody.email,
        password: 'HASHED',
      }),
    });
    expect(body).not.toHaveProperty('password');
    expect(body).toMatchObject({ id: 'p-1', email: baseBody.email });
  });

  it('returns 500 with the underlying error message on unexpected failure', async () => {
    vi.mocked(prisma.patient.findUnique).mockRejectedValue(new Error('db down'));
    const body = await expectJson(
      await POST(makeRequest({ method: 'POST', body: baseBody })),
      500,
    );
    expect(body).toEqual({ error: 'db down' });
  });
});
