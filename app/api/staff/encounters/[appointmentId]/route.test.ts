import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET, PATCH } from './route';
import { requireRole } from '@/lib/rbac';
import * as service from '@/modules/encounters/service';
import { setRbac, makeRequest, withParams, expectJson } from '@/tests/helpers';

vi.mock('@/lib/rbac', () => ({ requireRole: vi.fn() }));
vi.mock('@/modules/encounters/service', () => ({
  getEncounterPage: vi.fn(),
  updateEncounterFields: vi.fn(),
}));

const mockRbac = vi.mocked(requireRole);

describe('GET /api/staff/encounters/[appointmentId]', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns the rbac response when not a doctor', async () => {
    setRbac(mockRbac, { authorized: false, status: 403 });
    const res = await GET(makeRequest(), withParams({ appointmentId: 'a-1' }));
    expect(res.status).toBe(403);
  });

  it('returns 404 when service returns NOT_FOUND', async () => {
    setRbac(mockRbac, { authorized: true, role: 'DOCTOR' });
    vi.mocked(service.getEncounterPage).mockResolvedValue({ error: 'NOT_FOUND' } as any);
    const res = await GET(makeRequest(), withParams({ appointmentId: 'a-x' }));
    await expectJson(res, 404);
  });

  it('returns 400 when service returns NOT_CONFIRMED', async () => {
    setRbac(mockRbac, { authorized: true, role: 'DOCTOR' });
    vi.mocked(service.getEncounterPage).mockResolvedValue({ error: 'NOT_CONFIRMED' } as any);
    const res = await GET(makeRequest(), withParams({ appointmentId: 'a-1' }));
    await expectJson(res, 400);
  });

  it('returns the encounter on success', async () => {
    setRbac(mockRbac, { authorized: true, role: 'DOCTOR', id: 'd-1' });
    const page = { appointment: {}, encounter: {} };
    vi.mocked(service.getEncounterPage).mockResolvedValue(page as any);
    const body = await expectJson(
      await GET(makeRequest(), withParams({ appointmentId: 'a-1' })),
      200,
    );
    expect(service.getEncounterPage).toHaveBeenCalledWith('a-1', 'd-1');
    expect(body).toEqual(page);
  });
});

describe('PATCH /api/staff/encounters/[appointmentId]', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns the rbac response when not a doctor', async () => {
    setRbac(mockRbac, { authorized: false });
    const res = await PATCH(
      makeRequest({ method: 'PATCH', body: { diagnosis: 'flu' } }),
      withParams({ appointmentId: 'a-1' }),
    );
    expect(res.status).toBe(403);
  });

  it('returns 404 when the encounter is missing', async () => {
    setRbac(mockRbac, { authorized: true, role: 'DOCTOR' });
    vi.mocked(service.updateEncounterFields).mockResolvedValue({ error: 'NOT_FOUND' } as any);
    const res = await PATCH(
      makeRequest({ method: 'PATCH', body: {} }),
      withParams({ appointmentId: 'a-x' }),
    );
    await expectJson(res, 404);
  });

  it('returns 409 when the encounter is locked', async () => {
    setRbac(mockRbac, { authorized: true, role: 'DOCTOR' });
    vi.mocked(service.updateEncounterFields).mockResolvedValue({ error: 'LOCKED' } as any);
    const res = await PATCH(
      makeRequest({ method: 'PATCH', body: {} }),
      withParams({ appointmentId: 'a-1' }),
    );
    await expectJson(res, 409);
  });

  it('returns the updated encounter on success', async () => {
    setRbac(mockRbac, { authorized: true, role: 'DOCTOR' });
    const updated = { id: 'e-1', diagnosis: 'flu' };
    vi.mocked(service.updateEncounterFields).mockResolvedValue(updated as any);
    const body = await expectJson(
      await PATCH(
        makeRequest({ method: 'PATCH', body: { diagnosis: 'flu' } }),
        withParams({ appointmentId: 'a-1' }),
      ),
      200,
    );
    expect(service.updateEncounterFields).toHaveBeenCalledWith('a-1', { diagnosis: 'flu' });
    expect(body).toEqual(updated);
  });
});
