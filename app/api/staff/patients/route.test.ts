import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from './route';
import { requireRole } from '@/lib/rbac';
import prisma from '@/lib/db';
import { setRbac, makeRequest, expectJson } from '@/tests/helpers';

vi.mock('@/lib/rbac', () => ({ requireRole: vi.fn() }));
vi.mock('@/lib/db', () => ({ default: { patient: { findMany: vi.fn() } } }));

const mockRbac = vi.mocked(requireRole);

const buildPatient = (overrides: Record<string, unknown> = {}) => ({
  id: 'p-1',
  firstName: 'John',
  lastName: 'Doe',
  email: 'j@x.com',
  phone: '555',
  password: 'hashed',
  notes: 'PRIVATE',
  ...overrides,
});

describe('GET /api/staff/patients', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns the rbac response when not authorized', async () => {
    setRbac(mockRbac, { authorized: false, status: 403 });
    const res = await GET(makeRequest());
    expect(res.status).toBe(403);
  });

  it('returns patients matching the search', async () => {
    setRbac(mockRbac, { authorized: true, role: 'DOCTOR' });
    vi.mocked(prisma.patient.findMany).mockResolvedValue([buildPatient()] as any);

    await expectJson(await GET(makeRequest({ searchParams: { q: 'john' } })), 200);
    const call = vi.mocked(prisma.patient.findMany).mock.calls[0][0];
    expect(call.where.OR).toEqual(
      expect.arrayContaining([
        { firstName: { contains: 'john', mode: 'insensitive' } },
        { lastName: { contains: 'john', mode: 'insensitive' } },
        { email: { contains: 'john', mode: 'insensitive' } },
        { phone: { contains: 'john', mode: 'insensitive' } },
      ]),
    );
  });

  it('hides notes and password for non-medical roles', async () => {
    setRbac(mockRbac, { authorized: true, role: 'RECEPTIONIST' });
    vi.mocked(prisma.patient.findMany).mockResolvedValue([buildPatient()] as any);

    const [p] = await expectJson(await GET(makeRequest()), 200);
    expect(p).not.toHaveProperty('notes');
    expect(p).not.toHaveProperty('password');
  });

  it('keeps notes for DOCTOR but always strips password', async () => {
    setRbac(mockRbac, { authorized: true, role: 'DOCTOR' });
    vi.mocked(prisma.patient.findMany).mockResolvedValue([buildPatient()] as any);

    const [p] = await expectJson(await GET(makeRequest()), 200);
    expect(p).toHaveProperty('notes', 'PRIVATE');
    expect(p).not.toHaveProperty('password');
  });

  it('keeps notes for ADMIN', async () => {
    setRbac(mockRbac, { authorized: true, role: 'ADMIN' });
    vi.mocked(prisma.patient.findMany).mockResolvedValue([buildPatient()] as any);

    const [p] = await expectJson(await GET(makeRequest()), 200);
    expect(p).toHaveProperty('notes');
  });
});
