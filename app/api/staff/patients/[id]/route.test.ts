import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from './route';
import { requireRole } from '@/lib/rbac';
import prisma from '@/lib/db';
import { setRbac, makeRequest, withParams, expectJson } from '@/tests/helpers';

vi.mock('@/lib/rbac', () => ({ requireRole: vi.fn() }));
vi.mock('@/lib/db', () => ({ default: { patient: { findUnique: vi.fn() } } }));

const mockRbac = vi.mocked(requireRole);

const buildPatient = () => ({
  id: 'p-1',
  firstName: 'John',
  lastName: 'Doe',
  email: 'j@x.com',
  phone: '555',
  password: 'hashed',
  notes: 'PRIVATE',
  appointments: [],
  invoices: [],
});

describe('GET /api/staff/patients/[id]', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns the rbac response when not authorized', async () => {
    setRbac(mockRbac, { authorized: false });
    const res = await GET(makeRequest(), withParams({ id: 'p-1' }));
    expect(res.status).toBe(403);
  });

  it('returns 404 when not found', async () => {
    setRbac(mockRbac, { authorized: true, role: 'DOCTOR' });
    vi.mocked(prisma.patient.findUnique).mockResolvedValue(null);
    await expectJson(await GET(makeRequest(), withParams({ id: 'p-x' })), 404);
  });

  it('strips password and notes for non-medical roles', async () => {
    setRbac(mockRbac, { authorized: true, role: 'RECEPTIONIST' });
    vi.mocked(prisma.patient.findUnique).mockResolvedValue(buildPatient() as any);

    const body = await expectJson(await GET(makeRequest(), withParams({ id: 'p-1' })), 200);
    expect(body).not.toHaveProperty('password');
    expect(body).not.toHaveProperty('notes');
  });

  it('keeps notes for ADMIN/DOCTOR', async () => {
    setRbac(mockRbac, { authorized: true, role: 'ADMIN' });
    vi.mocked(prisma.patient.findUnique).mockResolvedValue(buildPatient() as any);

    const body = await expectJson(await GET(makeRequest(), withParams({ id: 'p-1' })), 200);
    expect(body).toHaveProperty('notes', 'PRIVATE');
    expect(body).not.toHaveProperty('password');
  });
});
