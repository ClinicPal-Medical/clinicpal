import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getServerSession } from 'next-auth/next';
import { GET } from './route';
import { getNotifications } from '@/lib/notifications';
import { setSession, expectJson } from '@/tests/helpers';

vi.mock('next-auth/next', () => ({ getServerSession: vi.fn() }));
vi.mock('@/lib/notifications', () => ({ getNotifications: vi.fn() }));

const mockSession = vi.mocked(getServerSession);

describe('GET /api/notifications', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 401 when unauthenticated', async () => {
    setSession(mockSession, null);
    await expectJson(await GET(), 401);
  });

  it('uses PATIENT recipientType for patient sessions', async () => {
    setSession(mockSession, { role: 'PATIENT', id: 'p-1' });
    vi.mocked(getNotifications).mockResolvedValue([] as any);

    await expectJson(await GET(), 200);
    expect(getNotifications).toHaveBeenCalledWith('p-1', 'PATIENT');
  });

  it('uses STAFF recipientType for non-patient sessions', async () => {
    setSession(mockSession, { role: 'DOCTOR', id: 's-1' });
    vi.mocked(getNotifications).mockResolvedValue([] as any);

    await expectJson(await GET(), 200);
    expect(getNotifications).toHaveBeenCalledWith('s-1', 'STAFF');
  });

  it('returns the notifications list', async () => {
    setSession(mockSession, { role: 'PATIENT', id: 'p-1' });
    const list = [{ id: 'n-1', title: 'Hi' }];
    vi.mocked(getNotifications).mockResolvedValue(list as any);

    const body = await expectJson(await GET(), 200);
    expect(body).toEqual(list);
  });

  it('returns 500 when the underlying lookup fails', async () => {
    setSession(mockSession, { role: 'PATIENT', id: 'p-1' });
    vi.mocked(getNotifications).mockRejectedValue(new Error('db'));
    const body = await expectJson(await GET(), 500);
    expect(body).toEqual({ error: 'Failed to fetch notifications' });
  });
});
