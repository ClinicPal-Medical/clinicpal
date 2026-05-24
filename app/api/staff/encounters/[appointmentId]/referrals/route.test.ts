import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from './route';
import { requireRole } from '@/lib/rbac';
import * as service from '@/modules/encounters/service';
import { setRbac, makeRequest, withParams, expectJson } from '@/tests/helpers';

vi.mock('@/lib/rbac', () => ({ requireRole: vi.fn() }));
vi.mock('@/modules/encounters/service', () => ({ createReferral: vi.fn() }));

const mockRbac = vi.mocked(requireRole);

describe('POST /api/staff/encounters/[appointmentId]/referrals', () => {
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
    vi.mocked(service.createReferral).mockResolvedValue({ error: 'NOT_FOUND' } as any);
    await expectJson(
      await POST(
        makeRequest({ method: 'POST', body: {} }),
        withParams({ appointmentId: 'a-x' }),
      ),
      404,
    );
  });

  it('forwards the referral fields and returns 201', async () => {
    setRbac(mockRbac, { authorized: true, role: 'DOCTOR', id: 'd-1' });
    vi.mocked(service.createReferral).mockResolvedValue({ id: 'r-1' } as any);

    const body = await expectJson(
      await POST(
        makeRequest({
          method: 'POST',
          body: { referredTo: 'ENT', reason: 'tinnitus', urgency: 'ROUTINE', notes: 'n' },
        }),
        withParams({ appointmentId: 'a-1' }),
      ),
      201,
    );

    expect(service.createReferral).toHaveBeenCalledWith('a-1', 'd-1', {
      referredTo: 'ENT',
      reason: 'tinnitus',
      urgency: 'ROUTINE',
      notes: 'n',
    });
    expect(body).toEqual({ id: 'r-1' });
  });
});
