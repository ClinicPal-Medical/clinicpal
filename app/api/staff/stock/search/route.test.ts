import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from './route';
import { requireRole } from '@/lib/rbac';
import * as stockService from '@/modules/stock/service';
import { setRbac, makeRequest, expectJson } from '@/tests/helpers';

vi.mock('@/lib/rbac', () => ({ requireRole: vi.fn() }));
vi.mock('@/modules/stock/service', () => ({ searchStockItems: vi.fn() }));

const mockRbac = vi.mocked(requireRole);

describe('GET /api/staff/stock/search', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns the rbac response when not authorized', async () => {
    setRbac(mockRbac, { authorized: false });
    const res = await GET(makeRequest());
    expect(res.status).toBe(403);
  });

  it('returns an empty array when the query is under 3 chars', async () => {
    setRbac(mockRbac, { authorized: true, role: 'NURSE' });
    const body = await expectJson(await GET(makeRequest({ searchParams: { q: 'ab' } })), 200);
    expect(body).toEqual([]);
    expect(stockService.searchStockItems).not.toHaveBeenCalled();
  });

  it('returns an empty array when q is missing', async () => {
    setRbac(mockRbac, { authorized: true, role: 'NURSE' });
    const body = await expectJson(await GET(makeRequest()), 200);
    expect(body).toEqual([]);
    expect(stockService.searchStockItems).not.toHaveBeenCalled();
  });

  it('trims and forwards the query when long enough', async () => {
    setRbac(mockRbac, { authorized: true, role: 'NURSE' });
    vi.mocked(stockService.searchStockItems).mockResolvedValue([{ id: 'i-1' }] as any);

    const body = await expectJson(
      await GET(makeRequest({ searchParams: { q: '  para ' } })),
      200,
    );
    expect(stockService.searchStockItems).toHaveBeenCalledWith('para');
    expect(body).toEqual([{ id: 'i-1' }]);
  });
});
