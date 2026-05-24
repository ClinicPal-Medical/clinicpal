import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getServerSession } from 'next-auth/next';
import { PATCH } from './route';
import prisma from '@/lib/db';
import { setSession, makeRequest, withParams, expectJson } from '@/tests/helpers';

vi.mock('next-auth/next', () => ({ getServerSession: vi.fn() }));
vi.mock('@/lib/db', () => ({
  default: { notification: { findUnique: vi.fn(), update: vi.fn() } },
}));

const mockSession = vi.mocked(getServerSession);

describe('PATCH /api/notifications/[id]', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns 401 when unauthenticated', async () => {
    setSession(mockSession, null);
    const res = await PATCH(
      makeRequest({ method: 'PATCH', body: { action: 'read' } }),
      withParams({ id: 'n-1' }),
    );
    await expectJson(res, 401);
  });

  it('returns 400 for an invalid action', async () => {
    setSession(mockSession, { role: 'PATIENT', id: 'p-1' });
    const res = await PATCH(
      makeRequest({ method: 'PATCH', body: { action: 'archive' } }),
      withParams({ id: 'n-1' }),
    );
    const body = await expectJson(res, 400);
    expect(body).toEqual({ error: 'Invalid action' });
  });

  it('returns 404 when the notification is missing', async () => {
    setSession(mockSession, { role: 'PATIENT', id: 'p-1' });
    vi.mocked(prisma.notification.findUnique).mockResolvedValue(null);
    const res = await PATCH(
      makeRequest({ method: 'PATCH', body: { action: 'read' } }),
      withParams({ id: 'n-1' }),
    );
    await expectJson(res, 404);
  });

  it('returns 404 when the notification belongs to someone else', async () => {
    setSession(mockSession, { role: 'PATIENT', id: 'p-1' });
    vi.mocked(prisma.notification.findUnique).mockResolvedValue({
      id: 'n-1',
      recipientId: 'p-other',
    } as any);
    const res = await PATCH(
      makeRequest({ method: 'PATCH', body: { action: 'read' } }),
      withParams({ id: 'n-1' }),
    );
    await expectJson(res, 404);
  });

  it('marks the notification as read', async () => {
    setSession(mockSession, { role: 'PATIENT', id: 'p-1' });
    vi.mocked(prisma.notification.findUnique).mockResolvedValue({
      id: 'n-1',
      recipientId: 'p-1',
    } as any);
    vi.mocked(prisma.notification.update).mockResolvedValue({ id: 'n-1', readAt: new Date() } as any);

    const res = await PATCH(
      makeRequest({ method: 'PATCH', body: { action: 'read' } }),
      withParams({ id: 'n-1' }),
    );
    await expectJson(res, 200);

    expect(prisma.notification.update).toHaveBeenCalledWith({
      where: { id: 'n-1' },
      data: { readAt: expect.any(Date) },
    });
  });

  it('marks the notification as dismissed', async () => {
    setSession(mockSession, { role: 'PATIENT', id: 'p-1' });
    vi.mocked(prisma.notification.findUnique).mockResolvedValue({
      id: 'n-1',
      recipientId: 'p-1',
    } as any);
    vi.mocked(prisma.notification.update).mockResolvedValue({} as any);

    await PATCH(
      makeRequest({ method: 'PATCH', body: { action: 'dismiss' } }),
      withParams({ id: 'n-1' }),
    );
    expect(prisma.notification.update).toHaveBeenCalledWith({
      where: { id: 'n-1' },
      data: { dismissedAt: expect.any(Date) },
    });
  });
});
