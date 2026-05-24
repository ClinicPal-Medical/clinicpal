import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from './route';
import prisma from '@/lib/db';
import { expectJson } from '@/tests/helpers';

vi.mock('@/lib/db', () => ({ default: { staff: { findMany: vi.fn() } } }));

describe('GET /api/staff', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns active staff', async () => {
    const staff = [{ id: 's-1', name: 'Dr X', role: 'DOCTOR' }];
    vi.mocked(prisma.staff.findMany).mockResolvedValue(staff as any);

    const body = await expectJson(await GET(), 200);
    expect(prisma.staff.findMany).toHaveBeenCalledWith({ where: { active: true } });
    expect(body).toEqual(staff);
  });

  it('returns 500 on db error', async () => {
    vi.mocked(prisma.staff.findMany).mockRejectedValue(new Error('boom'));
    const body = await expectJson(await GET(), 500);
    expect(body).toEqual({ error: 'Failed to fetch staff' });
  });
});
