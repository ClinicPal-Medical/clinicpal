import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from './route';
import { requireRole } from '@/lib/rbac';
import * as billingService from '@/modules/billing/service';
import { setRbac, makeRequest, expectJson } from '@/tests/helpers';

vi.mock('@/lib/rbac', () => ({ requireRole: vi.fn() }));
vi.mock('@/modules/billing/service', () => ({ getRevenueMetrics: vi.fn() }));

const mockRbac = vi.mocked(requireRole);

describe('GET /api/staff/revenue', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns the rbac response when not authorized (ADMIN only)', async () => {
    setRbac(mockRbac, { authorized: false, status: 403 });
    const res = await GET(makeRequest());
    expect(res.status).toBe(403);
  });

  it('parses month/year query params and calls the service', async () => {
    setRbac(mockRbac, { authorized: true, role: 'ADMIN' });
    vi.mocked(billingService.getRevenueMetrics).mockResolvedValue({ mtdRevenue: 100 } as any);

    await expectJson(
      await GET(makeRequest({ searchParams: { month: '7', year: '2026' } })),
      200,
    );
    expect(billingService.getRevenueMetrics).toHaveBeenCalledWith(7, 2026);
  });

  it('defaults month/year to the current date when omitted', async () => {
    setRbac(mockRbac, { authorized: true, role: 'ADMIN' });
    vi.mocked(billingService.getRevenueMetrics).mockResolvedValue({} as any);

    await GET(makeRequest());
    const now = new Date();
    expect(billingService.getRevenueMetrics).toHaveBeenCalledWith(
      now.getMonth() + 1,
      now.getFullYear(),
    );
  });
});
