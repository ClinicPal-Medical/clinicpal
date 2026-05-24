import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from './route';
import { requireRole } from '@/lib/rbac';
import prisma from '@/lib/db';
import { setRbac, makeRequest, expectJson } from '@/tests/helpers';

vi.mock('@/lib/rbac', () => ({ requireRole: vi.fn() }));
vi.mock('@/lib/db', () => ({ default: { appointment: { findMany: vi.fn() } } }));

const mockRbac = vi.mocked(requireRole);

describe('GET /api/staff/appointments', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns the rbac response when not authorized', async () => {
    setRbac(mockRbac, { authorized: false, status: 403 });
    const res = await GET(makeRequest());
    expect(res.status).toBe(403);
  });

  it('lists all appointments without filters', async () => {
    setRbac(mockRbac, { authorized: true, role: 'DOCTOR' });
    vi.mocked(prisma.appointment.findMany).mockResolvedValue([] as any);

    await expectJson(await GET(makeRequest()), 200);
    expect(prisma.appointment.findMany).toHaveBeenCalledWith({
      where: {},
      include: { patient: true, staff: true },
      orderBy: { scheduledAt: 'asc' },
    });
  });

  it('applies a date range when ?date= is passed', async () => {
    setRbac(mockRbac, { authorized: true, role: 'NURSE' });
    vi.mocked(prisma.appointment.findMany).mockResolvedValue([] as any);

    await GET(makeRequest({ searchParams: { date: '2026-07-01' } }));
    const call = vi.mocked(prisma.appointment.findMany).mock.calls[0][0];
    expect(call.where.scheduledAt.gte).toBeInstanceOf(Date);
    expect(call.where.scheduledAt.lte).toBeInstanceOf(Date);
  });

  it('filters by staffId when not "all"', async () => {
    setRbac(mockRbac, { authorized: true, role: 'ADMIN' });
    vi.mocked(prisma.appointment.findMany).mockResolvedValue([] as any);

    await GET(makeRequest({ searchParams: { staffId: 's-7' } }));
    expect(prisma.appointment.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { staffId: 's-7' } }),
    );
  });

  it('ignores staffId when "all"', async () => {
    setRbac(mockRbac, { authorized: true, role: 'ADMIN' });
    vi.mocked(prisma.appointment.findMany).mockResolvedValue([] as any);

    await GET(makeRequest({ searchParams: { staffId: 'all' } }));
    expect(prisma.appointment.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: {} }),
    );
  });
});
