import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from './route';
import { requireRole } from '@/lib/rbac';
import * as service from '@/modules/encounters/service';
import { setRbac, makeRequest, withParams, expectJson } from '@/tests/helpers';

vi.mock('@/lib/rbac', () => ({ requireRole: vi.fn() }));
vi.mock('@/modules/encounters/service', () => ({ completeEncounter: vi.fn() }));

const mockRbac = vi.mocked(requireRole);

describe('POST /api/staff/encounters/[appointmentId]/complete', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns the rbac response when not a doctor', async () => {
    setRbac(mockRbac, { authorized: false });
    const res = await POST(makeRequest({ method: 'POST' }), withParams({ appointmentId: 'a-1' }));
    expect(res.status).toBe(403);
  });

  it('returns 404 when not found', async () => {
    setRbac(mockRbac, { authorized: true, role: 'DOCTOR' });
    vi.mocked(service.completeEncounter).mockResolvedValue({ error: 'NOT_FOUND' } as any);
    const res = await POST(makeRequest({ method: 'POST' }), withParams({ appointmentId: 'a-x' }));
    await expectJson(res, 404);
  });

  it('returns 400 when required fields are missing', async () => {
    setRbac(mockRbac, { authorized: true, role: 'DOCTOR' });
    vi.mocked(service.completeEncounter).mockResolvedValue({ error: 'MISSING_FIELDS' } as any);
    const body = await expectJson(
      await POST(makeRequest({ method: 'POST' }), withParams({ appointmentId: 'a-1' })),
      400,
    );
    expect(body.error).toMatch(/required/);
  });

  it('returns the encounter on success', async () => {
    setRbac(mockRbac, { authorized: true, role: 'DOCTOR' });
    const encounter = { id: 'e-1', status: 'COMPLETED' };
    vi.mocked(service.completeEncounter).mockResolvedValue(encounter as any);
    const body = await expectJson(
      await POST(makeRequest({ method: 'POST' }), withParams({ appointmentId: 'a-1' })),
      200,
    );
    expect(body).toEqual(encounter);
  });
});
