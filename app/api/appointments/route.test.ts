import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getServerSession } from 'next-auth/next';
import { GET, POST } from './route';
import * as service from '@/modules/appointments/service';
import { setSession, makeRequest, expectJson } from '@/tests/helpers';

vi.mock('next-auth/next', () => ({ getServerSession: vi.fn() }));
vi.mock('@/modules/appointments/service', () => ({
  getPatientAppointments: vi.fn(),
  bookAppointment: vi.fn(),
}));

const mockSession = vi.mocked(getServerSession);

describe('GET /api/appointments', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 401 when unauthenticated', async () => {
    setSession(mockSession, null);
    const body = await expectJson(await GET(makeRequest()), 401);
    expect(body).toEqual({ error: 'Unauthorized' });
  });

  it('returns 401 when not a patient', async () => {
    setSession(mockSession, { role: 'DOCTOR' });
    await expectJson(await GET(makeRequest()), 401);
  });

  it('returns the patient appointments on success', async () => {
    setSession(mockSession, { role: 'PATIENT', id: 'p-1' });
    const appts = [{ id: 'a-1' }];
    vi.mocked(service.getPatientAppointments).mockResolvedValue(appts as any);

    const body = await expectJson(await GET(makeRequest()), 200);
    expect(service.getPatientAppointments).toHaveBeenCalledWith('p-1');
    expect(body).toEqual(appts);
  });

  it('returns 500 when the service throws', async () => {
    setSession(mockSession, { role: 'PATIENT' });
    vi.mocked(service.getPatientAppointments).mockRejectedValue(new Error('boom'));
    const body = await expectJson(await GET(makeRequest()), 500);
    expect(body).toEqual({ error: 'Failed to fetch appointments' });
  });
});

describe('POST /api/appointments', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 401 when unauthenticated', async () => {
    setSession(mockSession, null);
    const req = makeRequest({ method: 'POST', body: { staffId: 's-1', scheduledAt: 'x' } });
    await expectJson(await POST(req), 401);
  });

  it('returns 400 when required fields are missing', async () => {
    setSession(mockSession, { role: 'PATIENT' });
    const req = makeRequest({ method: 'POST', body: { reason: 'checkup' } });
    const body = await expectJson(await POST(req), 400);
    expect(body).toEqual({ error: 'Missing required fields' });
  });

  it('books the appointment and returns it', async () => {
    setSession(mockSession, { role: 'PATIENT', id: 'p-1' });
    const appt = { id: 'a-1' };
    vi.mocked(service.bookAppointment).mockResolvedValue(appt as any);

    const req = makeRequest({
      method: 'POST',
      body: { staffId: 's-1', scheduledAt: '2026-07-01T10:00:00Z', reason: 'cough' },
    });
    const body = await expectJson(await POST(req), 200);

    expect(service.bookAppointment).toHaveBeenCalledWith(
      'p-1',
      's-1',
      '2026-07-01T10:00:00Z',
      'cough',
    );
    expect(body).toEqual(appt);
  });

  it('passes empty reason when omitted', async () => {
    setSession(mockSession, { role: 'PATIENT', id: 'p-1' });
    vi.mocked(service.bookAppointment).mockResolvedValue({ id: 'a-1' } as any);
    const req = makeRequest({
      method: 'POST',
      body: { staffId: 's-1', scheduledAt: '2026-07-01T10:00:00Z' },
    });
    await POST(req);
    expect(service.bookAppointment).toHaveBeenCalledWith('p-1', 's-1', '2026-07-01T10:00:00Z', '');
  });

  it('surfaces service errors as 500', async () => {
    setSession(mockSession, { role: 'PATIENT' });
    vi.mocked(service.bookAppointment).mockRejectedValue(new Error('slot taken'));
    const req = makeRequest({
      method: 'POST',
      body: { staffId: 's-1', scheduledAt: 'x' },
    });
    const body = await expectJson(await POST(req), 500);
    expect(body).toEqual({ error: 'slot taken' });
  });
});
