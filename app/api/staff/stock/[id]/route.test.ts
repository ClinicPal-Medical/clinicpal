import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PUT, DELETE } from './route';
import { requireRole } from '@/lib/rbac';
import * as stockService from '@/modules/stock/service';
import { setRbac, makeRequest, withParams, expectJson } from '@/tests/helpers';

vi.mock('@/lib/rbac', () => ({ requireRole: vi.fn() }));
vi.mock('@/modules/stock/service', () => ({
  updateStockItem: vi.fn(),
  deleteStockItem: vi.fn(),
}));

const mockRbac = vi.mocked(requireRole);

describe('PUT /api/staff/stock/[id]', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns the rbac response when not authorized', async () => {
    setRbac(mockRbac, { authorized: false });
    const res = await PUT(
      makeRequest({ method: 'PUT', body: {} }),
      withParams({ id: 'i-1' }),
    );
    expect(res.status).toBe(403);
  });

  it('updates the item and coerces expiry to Date', async () => {
    setRbac(mockRbac, { authorized: true, role: 'NURSE' });
    vi.mocked(stockService.updateStockItem).mockResolvedValue({ id: 'i-1' } as any);

    await expectJson(
      await PUT(
        makeRequest({ method: 'PUT', body: { name: 'X', expiry: '2027-01-01' } }),
        withParams({ id: 'i-1' }),
      ),
      200,
    );

    const call = vi.mocked(stockService.updateStockItem).mock.calls[0];
    expect(call[0]).toBe('i-1');
    expect(call[1].expiry).toBeInstanceOf(Date);
  });

  it('returns 400 when the service throws', async () => {
    setRbac(mockRbac, { authorized: true, role: 'ADMIN' });
    vi.mocked(stockService.updateStockItem).mockRejectedValue(new Error('not found'));

    const body = await expectJson(
      await PUT(
        makeRequest({ method: 'PUT', body: {} }),
        withParams({ id: 'i-1' }),
      ),
      400,
    );
    expect(body).toEqual({ error: 'not found' });
  });
});

describe('DELETE /api/staff/stock/[id]', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns the rbac response when not authorized', async () => {
    setRbac(mockRbac, { authorized: false });
    const res = await DELETE(makeRequest({ method: 'DELETE' }), withParams({ id: 'i-1' }));
    expect(res.status).toBe(403);
  });

  it('deletes and returns success', async () => {
    setRbac(mockRbac, { authorized: true, role: 'ADMIN' });
    vi.mocked(stockService.deleteStockItem).mockResolvedValue(undefined as any);

    const body = await expectJson(
      await DELETE(makeRequest({ method: 'DELETE' }), withParams({ id: 'i-1' })),
      200,
    );
    expect(stockService.deleteStockItem).toHaveBeenCalledWith('i-1');
    expect(body).toEqual({ success: true });
  });

  it('returns 400 on service error', async () => {
    setRbac(mockRbac, { authorized: true, role: 'ADMIN' });
    vi.mocked(stockService.deleteStockItem).mockRejectedValue(new Error('referenced'));
    const body = await expectJson(
      await DELETE(makeRequest({ method: 'DELETE' }), withParams({ id: 'i-1' })),
      400,
    );
    expect(body).toEqual({ error: 'referenced' });
  });
});
