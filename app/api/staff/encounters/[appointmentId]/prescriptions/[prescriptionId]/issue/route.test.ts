import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PATCH } from './route';
import { requireRole } from '@/lib/rbac';
import * as service from '@/modules/encounters/service';
import { setRbac, makeRequest, withParams, expectJson } from '@/tests/helpers';

vi.mock('@/lib/rbac', () => ({ requireRole: vi.fn() }));
vi.mock('@/modules/encounters/service', () => ({ issuePrescription: vi.fn() }));

const mockRbac = vi.mocked(requireRole);
const params = withParams({ appointmentId: 'a-1', prescriptionId: 'rx-1' });

describe('PATCH /api/staff/encounters/[appointmentId]/prescriptions/[prescriptionId]/issue', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns the rbac response when not a doctor', async () => {
    setRbac(mockRbac, { authorized: false });
    const res = await PATCH(makeRequest({ method: 'PATCH' }), params);
    expect(res.status).toBe(403);
  });

  it('returns 404 when not found', async () => {
    setRbac(mockRbac, { authorized: true, role: 'DOCTOR' });
    vi.mocked(service.issuePrescription).mockResolvedValue({ error: 'NOT_FOUND' } as any);
    await expectJson(await PATCH(makeRequest({ method: 'PATCH' }), params), 404);
  });

  it('returns 409 when already issued', async () => {
    setRbac(mockRbac, { authorized: true, role: 'DOCTOR' });
    vi.mocked(service.issuePrescription).mockResolvedValue({ error: 'ALREADY_ISSUED' } as any);
    await expectJson(await PATCH(makeRequest({ method: 'PATCH' }), params), 409);
  });

  it('returns 400 with the out-of-stock list', async () => {
    setRbac(mockRbac, { authorized: true, role: 'DOCTOR' });
    vi.mocked(service.issuePrescription).mockResolvedValue({
      error: 'OUT_OF_STOCK',
      outOfStockItems: ['Amoxicillin'],
    } as any);
    const body = await expectJson(await PATCH(makeRequest({ method: 'PATCH' }), params), 400);
    expect(body.outOfStockItems).toEqual(['Amoxicillin']);
  });

  it('issues successfully', async () => {
    setRbac(mockRbac, { authorized: true, role: 'DOCTOR', id: 'd-1' });
    const issued = { id: 'rx-1', issuedAt: new Date().toISOString() };
    vi.mocked(service.issuePrescription).mockResolvedValue(issued as any);
    const body = await expectJson(await PATCH(makeRequest({ method: 'PATCH' }), params), 200);
    expect(service.issuePrescription).toHaveBeenCalledWith('a-1', 'rx-1', 'd-1');
    expect(body).toEqual(issued);
  });
});
