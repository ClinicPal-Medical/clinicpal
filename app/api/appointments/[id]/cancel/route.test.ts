import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getServerSession } from 'next-auth/next';
import { PATCH } from './route';
import * as service from '@/modules/appointments/service';
import { setSession, makeRequest, withParams, expectJson } from '@/tests/helpers';

vi.mock('next-auth/next', () => ({ getServerSession: vi.fn() }));
vi.mock('@/modules/appointments/service', () => ({ cancelAppointment: vi.fn() }));

const mockSession = vi.mocked(getServerSession);

describe('PATCH /api/appointments/[id]/cancel', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 401 when unauthenticated', async () => {
    setSession(mockSession, null);
    const res = await PATCH(makeRequest({ method: 'PATCH' }), withParams({ id: 'a-1' }));
    await expectJson(res, 401);
  });

  it('returns 401 when role is not PATIENT', async () => {
    setSession(mockSession, { role: 'DOCTOR' });
    const res = await PATCH(makeRequest({ method: 'PATCH' }), withParams({ id: 'a-1' }));
    await expectJson(res, 401);
  });

  it('cancels and returns the updated appointment', async () => {
    setSession(mockSession, { role: 'PATIENT', id: 'p-1' });
    const cancelled = { id: 'a-1', status: 'CANCELLED' };
    vi.mocked(service.cancelAppointment).mockResolvedValue(cancelled as any);

    const body = await expectJson(
      await PATCH(makeRequest({ method: 'PATCH' }), withParams({ id: 'a-1' })),
      200,
    );

    expect(service.cancelAppointment).toHaveBeenCalledWith('a-1', 'p-1');
    expect(body).toEqual(cancelled);
  });

  it('surfaces service errors as 500 with the original message', async () => {
    setSession(mockSession, { role: 'PATIENT' });
    vi.mocked(service.cancelAppointment).mockRejectedValue(new Error('Too late'));
    const body = await expectJson(
      await PATCH(makeRequest({ method: 'PATCH' }), withParams({ id: 'a-1' })),
      500,
    );
    expect(body).toEqual({ error: 'Too late' });
  });
});
