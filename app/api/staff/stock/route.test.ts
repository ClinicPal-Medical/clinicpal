import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET, POST } from './route';
import { requireRole } from '@/lib/rbac';
import * as stockService from '@/modules/stock/service';
import { setRbac, makeRequest, expectJson } from '@/tests/helpers';

vi.mock('@/lib/rbac', () => ({ requireRole: vi.fn() }));
vi.mock('@/modules/stock/service', () => ({
  getStockItems: vi.fn(),
  createStockItem: vi.fn(),
}));

const mockRbac = vi.mocked(requireRole);

describe('GET /api/staff/stock', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns the rbac response when not authorized', async () => {
    setRbac(mockRbac, { authorized: false });
    const res = await GET();
    expect(res.status).toBe(403);
  });

  it('returns the stock items', async () => {
    setRbac(mockRbac, { authorized: true, role: 'NURSE' });
    vi.mocked(stockService.getStockItems).mockResolvedValue([{ id: 'i-1' }] as any);
    const body = await expectJson(await GET(), 200);
    expect(body).toEqual([{ id: 'i-1' }]);
  });
});

describe('POST /api/staff/stock', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns the rbac response when not authorized', async () => {
    setRbac(mockRbac, { authorized: false });
    const res = await POST(makeRequest({ method: 'POST', body: {} }));
    expect(res.status).toBe(403);
  });

  it('creates an item, coercing expiry to Date', async () => {
    setRbac(mockRbac, { authorized: true, role: 'NURSE' });
    vi.mocked(stockService.createStockItem).mockResolvedValue({ id: 'i-1' } as any);

    const payload = { name: 'Paracetamol', category: 'Meds', expiry: '2026-12-01' };
    await expectJson(
      await POST(makeRequest({ method: 'POST', body: payload })),
      200,
    );

    const call = vi.mocked(stockService.createStockItem).mock.calls[0][0];
    expect(call.expiry).toBeInstanceOf(Date);
    expect(call.name).toBe('Paracetamol');
  });

  it('keeps expiry undefined when not provided', async () => {
    setRbac(mockRbac, { authorized: true, role: 'ADMIN' });
    vi.mocked(stockService.createStockItem).mockResolvedValue({ id: 'i-1' } as any);
    await POST(makeRequest({ method: 'POST', body: { name: 'X', category: 'Y' } }));
    const call = vi.mocked(stockService.createStockItem).mock.calls[0][0];
    expect(call.expiry).toBeUndefined();
  });
});
