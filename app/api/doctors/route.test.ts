import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from './route';
import prisma from '@/lib/db';
import { expectJson } from '@/tests/helpers';

vi.mock('@/lib/db', () => ({ default: { staff: { findMany: vi.fn() } } }));

describe('GET /api/doctors', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns the list of active doctors', async () => {
    const doctors = [
      { id: 's-1', name: 'Dr. Smith', email: 's@x.com', specialisation: 'GP' },
    ];
    vi.mocked(prisma.staff.findMany).mockResolvedValue(doctors as any);

    const body = await expectJson(await GET(), 200);
    expect(prisma.staff.findMany).toHaveBeenCalledWith({
      where: { role: 'DOCTOR', active: true },
      select: { id: true, name: true, email: true, specialisation: true },
    });
    expect(body).toEqual(doctors);
  });

  it('returns 500 when the database errors', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.mocked(prisma.staff.findMany).mockRejectedValue(new Error('boom'));
    const body = await expectJson(await GET(), 500);
    expect(body).toEqual({ error: 'Failed to fetch doctors' });
  });
});
