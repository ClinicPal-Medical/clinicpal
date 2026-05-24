import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getServerSession } from 'next-auth/next';
import { GET, PATCH } from './route';
import * as service from '@/modules/patients/service';
import { setSession, makeRequest, expectJson } from '@/tests/helpers';

vi.mock('next-auth/next', () => ({ getServerSession: vi.fn() }));
vi.mock('@/modules/patients/service', () => ({
  getPatientById: vi.fn(),
  updatePatientProfile: vi.fn(),
}));

const mockSession = vi.mocked(getServerSession);

describe('GET /api/patient/profile', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 401 when unauthenticated', async () => {
    setSession(mockSession, null);
    await expectJson(await GET(makeRequest()), 401);
  });

  it('returns 401 when not a patient', async () => {
    setSession(mockSession, { role: 'DOCTOR' });
    await expectJson(await GET(makeRequest()), 401);
  });

  it('returns the patient on success', async () => {
    setSession(mockSession, { role: 'PATIENT', id: 'p-1' });
    const patient = { id: 'p-1', firstName: 'John' };
    vi.mocked(service.getPatientById).mockResolvedValue(patient as any);

    const body = await expectJson(await GET(makeRequest()), 200);
    expect(service.getPatientById).toHaveBeenCalledWith('p-1');
    expect(body).toEqual(patient);
  });

  it('returns 500 when the service throws', async () => {
    setSession(mockSession, { role: 'PATIENT' });
    vi.mocked(service.getPatientById).mockRejectedValue(new Error('boom'));
    const body = await expectJson(await GET(makeRequest()), 500);
    expect(body).toEqual({ error: 'Failed to fetch profile' });
  });
});

describe('PATCH /api/patient/profile', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 401 when unauthenticated', async () => {
    setSession(mockSession, null);
    await expectJson(
      await PATCH(makeRequest({ method: 'PATCH', body: { firstName: 'J' } })),
      401,
    );
  });

  it('updates the profile and returns it', async () => {
    setSession(mockSession, { role: 'PATIENT', id: 'p-1' });
    const updates = { firstName: 'Jane' };
    vi.mocked(service.updatePatientProfile).mockResolvedValue({ id: 'p-1', ...updates } as any);

    const body = await expectJson(
      await PATCH(makeRequest({ method: 'PATCH', body: updates })),
      200,
    );

    expect(service.updatePatientProfile).toHaveBeenCalledWith('p-1', updates);
    expect(body).toMatchObject(updates);
  });

  it('returns 500 when the service throws', async () => {
    setSession(mockSession, { role: 'PATIENT' });
    vi.mocked(service.updatePatientProfile).mockRejectedValue(new Error('boom'));
    const body = await expectJson(
      await PATCH(makeRequest({ method: 'PATCH', body: { firstName: 'X' } })),
      500,
    );
    expect(body).toEqual({ error: 'Failed to update profile' });
  });
});
