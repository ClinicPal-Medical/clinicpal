import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from './route';
import * as service from '@/modules/appointments/service';
import { makeRequest, expectJson } from '@/tests/helpers';

vi.mock('@/modules/appointments/service', () => ({ getAvailableSlots: vi.fn() }));

describe('GET /api/appointments/slots', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 400 when staffId or date is missing', async () => {
    const body = await expectJson(await GET(makeRequest()), 400);
    expect(body).toEqual({ error: 'Missing staffId or date' });
  });

  it('returns 400 when only one of staffId/date is provided', async () => {
    const res = await GET(makeRequest({ searchParams: { staffId: 's-1' } }));
    await expectJson(res, 400);
  });

  it('returns the slot list on success', async () => {
    const slots = ['2026-07-01T09:00:00Z', '2026-07-01T09:30:00Z'];
    vi.mocked(service.getAvailableSlots).mockResolvedValue(slots);

    const body = await expectJson(
      await GET(makeRequest({ searchParams: { staffId: 's-1', date: '2026-07-01' } })),
      200,
    );

    expect(service.getAvailableSlots).toHaveBeenCalledWith('s-1', '2026-07-01');
    expect(body).toEqual(slots);
  });

  it('returns 500 when the service throws', async () => {
    vi.mocked(service.getAvailableSlots).mockRejectedValue(new Error('db down'));
    const body = await expectJson(
      await GET(makeRequest({ searchParams: { staffId: 's-1', date: '2026-07-01' } })),
      500,
    );
    expect(body).toEqual({ error: 'Failed to fetch slots' });
  });
});
