import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DELETE } from './route';
import { requireRole } from '@/lib/rbac';
import * as service from '@/modules/encounters/service';
import { setRbac, makeRequest, withParams, expectJson } from '@/tests/helpers';

vi.mock('@/lib/rbac', () => ({ requireRole: vi.fn() }));
vi.mock('@/modules/encounters/service', () => ({ deleteCertificate: vi.fn() }));

const mockRbac = vi.mocked(requireRole);
const params = withParams({ appointmentId: 'a-1', certificateId: 'c-1' });

describe('DELETE /api/staff/encounters/[appointmentId]/certificates/[certificateId]', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns the rbac response when not a doctor', async () => {
    setRbac(mockRbac, { authorized: false });
    const res = await DELETE(makeRequest({ method: 'DELETE' }), params);
    expect(res.status).toBe(403);
  });

  it('returns 404 when not found', async () => {
    setRbac(mockRbac, { authorized: true, role: 'DOCTOR' });
    vi.mocked(service.deleteCertificate).mockResolvedValue({ error: 'NOT_FOUND' } as any);
    await expectJson(await DELETE(makeRequest({ method: 'DELETE' }), params), 404);
  });

  it('returns 409 when already issued', async () => {
    setRbac(mockRbac, { authorized: true, role: 'DOCTOR' });
    vi.mocked(service.deleteCertificate).mockResolvedValue({ error: 'ALREADY_ISSUED' } as any);
    await expectJson(await DELETE(makeRequest({ method: 'DELETE' }), params), 409);
  });

  it('deletes successfully', async () => {
    setRbac(mockRbac, { authorized: true, role: 'DOCTOR' });
    vi.mocked(service.deleteCertificate).mockResolvedValue({ ok: true } as any);
    const body = await expectJson(await DELETE(makeRequest({ method: 'DELETE' }), params), 200);
    expect(service.deleteCertificate).toHaveBeenCalledWith('a-1', 'c-1');
    expect(body).toEqual({ ok: true });
  });
});
