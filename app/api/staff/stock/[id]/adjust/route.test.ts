import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PATCH } from './route';
import { requireRole } from '@/lib/rbac';
import * as stockService from '@/modules/stock/service';
import { setRbac, makeRequest, withParams, expectJson } from '@/tests/helpers';

vi.mock('@/lib/rbac', () => ({ requireRole: vi.fn() }));
vi.mock('@/modules/stock/service', () => ({ adjustStock: vi.fn() }));

const mockRbac = vi.mocked(requireRole);

describe('PATCH /api/staff/stock/[id]/adjust', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns the rbac response when not authorized', async () => {
    setRbac(mockRbac, { authorized: false });
    const res = await PATCH(
      makeRequest({ method: 'PATCH', body: { quantityDelta: 1, type: 'RECEIVED' } }),
      withParams({ id: 'i-1' }),
    );
    expect(res.status).toBe(403);
  });

  it('forwards the adjustment to the service with the staffId from session', async () => {
    setRbac(mockRbac, { authorized: true, role: 'NURSE', id: 's-7' });
    vi.mocked(stockService.adjustStock).mockResolvedValue({ id: 'i-1' } as any);

    await expectJson(
      await PATCH(
        makeRequest({
          method: 'PATCH',
          body: { quantityDelta: 5, type: 'USED', notes: 'admin' },
        }),
        withParams({ id: 'i-1' }),
      ),
      200,
    );

    expect(stockService.adjustStock).toHaveBeenCalledWith('i-1', 's-7', 5, 'USED', 'admin');
  });

  it('returns 400 with the message when the service rejects', async () => {
    setRbac(mockRbac, { authorized: true, role: 'DOCTOR' });
    vi.mocked(stockService.adjustStock).mockRejectedValue(new Error('insufficient stock'));

    const body = await expectJson(
      await PATCH(
        makeRequest({ method: 'PATCH', body: { quantityDelta: -100, type: 'USED' } }),
        withParams({ id: 'i-1' }),
      ),
      400,
    );
    expect(body).toEqual({ error: 'insufficient stock' });
  });
});
