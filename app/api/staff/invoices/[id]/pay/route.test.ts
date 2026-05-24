import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PATCH } from './route';
import { requireRole } from '@/lib/rbac';
import * as billingService from '@/modules/billing/service';
import { setRbac, makeRequest, withParams, expectJson } from '@/tests/helpers';

vi.mock('@/lib/rbac', () => ({ requireRole: vi.fn() }));
vi.mock('@/modules/billing/service', () => ({ markInvoicePaid: vi.fn() }));

const mockRbac = vi.mocked(requireRole);

describe('PATCH /api/staff/invoices/[id]/pay', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns the rbac response when not authorized', async () => {
    setRbac(mockRbac, { authorized: false });
    const res = await PATCH(
      makeRequest({ method: 'PATCH' }),
      withParams({ id: 'inv-1' }),
    );
    expect(res.status).toBe(403);
  });

  it('marks the invoice as paid', async () => {
    setRbac(mockRbac, { authorized: true, role: 'ADMIN' });
    vi.mocked(billingService.markInvoicePaid).mockResolvedValue({ id: 'inv-1', status: 'PAID' } as any);

    const body = await expectJson(
      await PATCH(makeRequest({ method: 'PATCH' }), withParams({ id: 'inv-1' })),
      200,
    );
    expect(billingService.markInvoicePaid).toHaveBeenCalledWith('inv-1');
    expect(body).toMatchObject({ status: 'PAID' });
  });

  it('returns 400 on service error', async () => {
    setRbac(mockRbac, { authorized: true, role: 'ADMIN' });
    vi.mocked(billingService.markInvoicePaid).mockRejectedValue(new Error('already paid'));
    const body = await expectJson(
      await PATCH(makeRequest({ method: 'PATCH' }), withParams({ id: 'inv-1' })),
      400,
    );
    expect(body).toEqual({ error: 'already paid' });
  });
});
