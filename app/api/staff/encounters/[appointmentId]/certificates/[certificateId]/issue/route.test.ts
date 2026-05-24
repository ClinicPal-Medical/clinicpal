import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PATCH } from './route';
import { requireRole } from '@/lib/rbac';
import * as service from '@/modules/encounters/service';
import { setRbac, makeRequest, withParams, expectJson } from '@/tests/helpers';

vi.mock('@/lib/rbac', () => ({ requireRole: vi.fn() }));
vi.mock('@/modules/encounters/service', () => ({ issueCertificate: vi.fn() }));

const mockRbac = vi.mocked(requireRole);
const params = withParams({ appointmentId: 'a-1', certificateId: 'c-1' });

describe('PATCH /api/staff/encounters/[appointmentId]/certificates/[certificateId]/issue', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns the rbac response when not a doctor', async () => {
    setRbac(mockRbac, { authorized: false });
    const res = await PATCH(makeRequest({ method: 'PATCH' }), params);
    expect(res.status).toBe(403);
  });

  it('returns 404 when not found', async () => {
    setRbac(mockRbac, { authorized: true, role: 'DOCTOR' });
    vi.mocked(service.issueCertificate).mockResolvedValue({ error: 'NOT_FOUND' } as any);
    await expectJson(await PATCH(makeRequest({ method: 'PATCH' }), params), 404);
  });

  it('returns 409 when already issued', async () => {
    setRbac(mockRbac, { authorized: true, role: 'DOCTOR' });
    vi.mocked(service.issueCertificate).mockResolvedValue({ error: 'ALREADY_ISSUED' } as any);
    await expectJson(await PATCH(makeRequest({ method: 'PATCH' }), params), 409);
  });

  it('issues successfully', async () => {
    setRbac(mockRbac, { authorized: true, role: 'DOCTOR' });
    const issued = { id: 'c-1', issuedAt: new Date().toISOString() };
    vi.mocked(service.issueCertificate).mockResolvedValue(issued as any);
    const body = await expectJson(await PATCH(makeRequest({ method: 'PATCH' }), params), 200);
    expect(service.issueCertificate).toHaveBeenCalledWith('a-1', 'c-1');
    expect(body).toEqual(issued);
  });
});
