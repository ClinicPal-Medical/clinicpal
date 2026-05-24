import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from './route';
import { requireRole } from '@/lib/rbac';
import * as service from '@/modules/encounters/service';
import { setRbac, makeRequest, withParams, expectJson } from '@/tests/helpers';

vi.mock('@/lib/rbac', () => ({ requireRole: vi.fn() }));
vi.mock('@/modules/encounters/service', () => ({ createPrescription: vi.fn() }));

const mockRbac = vi.mocked(requireRole);

describe('POST /api/staff/encounters/[appointmentId]/prescriptions', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns the rbac response when not a doctor', async () => {
    setRbac(mockRbac, { authorized: false });
    const res = await POST(
      makeRequest({ method: 'POST', body: {} }),
      withParams({ appointmentId: 'a-1' }),
    );
    expect(res.status).toBe(403);
  });

  it('returns 404 when the encounter is missing', async () => {
    setRbac(mockRbac, { authorized: true, role: 'DOCTOR' });
    vi.mocked(service.createPrescription).mockResolvedValue({ error: 'NOT_FOUND' } as any);
    const res = await POST(
      makeRequest({ method: 'POST', body: {} }),
      withParams({ appointmentId: 'a-x' }),
    );
    await expectJson(res, 404);
  });

  it('returns 400 with the unrecognised items list', async () => {
    setRbac(mockRbac, { authorized: true, role: 'DOCTOR' });
    vi.mocked(service.createPrescription).mockResolvedValue({
      error: 'UNRECOGNISED_ITEMS',
      unrecognised: ['Foozolin'],
    } as any);
    const body = await expectJson(
      await POST(
        makeRequest({ method: 'POST', body: { type: 'INTERNAL', items: [] } }),
        withParams({ appointmentId: 'a-1' }),
      ),
      400,
    );
    expect(body.unrecognised).toEqual(['Foozolin']);
  });

  it('creates the prescription and returns 201', async () => {
    setRbac(mockRbac, { authorized: true, role: 'DOCTOR', id: 'd-1' });
    const prescription = { id: 'rx-1' };
    vi.mocked(service.createPrescription).mockResolvedValue(prescription as any);

    const payload = { type: 'EXTERNAL', items: [{ medicationName: 'X' }], notes: '' };
    const body = await expectJson(
      await POST(
        makeRequest({ method: 'POST', body: payload }),
        withParams({ appointmentId: 'a-1' }),
      ),
      201,
    );
    expect(service.createPrescription).toHaveBeenCalledWith('a-1', 'd-1', payload);
    expect(body).toEqual(prescription);
  });
});
