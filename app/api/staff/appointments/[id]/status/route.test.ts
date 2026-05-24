import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PATCH } from './route';
import { requireRole } from '@/lib/rbac';
import prisma from '@/lib/db';
import { setRbac, makeRequest, withParams, expectJson } from '@/tests/helpers';

vi.mock('@/lib/rbac', () => ({ requireRole: vi.fn() }));
vi.mock('@/lib/db', () => ({
  default: {
    appointment: { findUnique: vi.fn(), update: vi.fn() },
    patient: { update: vi.fn() },
  },
}));

const mockRbac = vi.mocked(requireRole);

describe('PATCH /api/staff/appointments/[id]/status', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns the rbac response when not authorized', async () => {
    setRbac(mockRbac, { authorized: false, status: 401 });
    const res = await PATCH(
      makeRequest({ method: 'PATCH', body: { status: 'CONFIRMED' } }),
      withParams({ id: 'a-1' }),
    );
    expect(res.status).toBe(401);
  });

  it('returns 404 when the appointment is missing', async () => {
    setRbac(mockRbac, { authorized: true, role: 'DOCTOR' });
    vi.mocked(prisma.appointment.findUnique).mockResolvedValue(null);
    const res = await PATCH(
      makeRequest({ method: 'PATCH', body: { status: 'CONFIRMED' } }),
      withParams({ id: 'a-x' }),
    );
    await expectJson(res, 404);
  });

  it('updates appointment status without touching notes for a NURSE', async () => {
    setRbac(mockRbac, { authorized: true, role: 'NURSE', name: 'Nurse N' });
    vi.mocked(prisma.appointment.findUnique).mockResolvedValue({
      id: 'a-1',
      patientId: 'p-1',
      patient: { notes: '' },
    } as any);
    vi.mocked(prisma.appointment.update).mockResolvedValue({ id: 'a-1', status: 'COMPLETED' } as any);

    const res = await PATCH(
      makeRequest({ method: 'PATCH', body: { status: 'COMPLETED', notes: 'looks good' } }),
      withParams({ id: 'a-1' }),
    );
    await expectJson(res, 200);

    expect(prisma.appointment.update).toHaveBeenCalledWith({
      where: { id: 'a-1' },
      data: { status: 'COMPLETED' },
    });
    expect(prisma.patient.update).not.toHaveBeenCalled();
  });

  it('appends clinical notes to the patient when role is DOCTOR', async () => {
    setRbac(mockRbac, { authorized: true, role: 'DOCTOR', name: 'Dr Who' });
    vi.mocked(prisma.appointment.findUnique).mockResolvedValue({
      id: 'a-1',
      patientId: 'p-1',
      patient: { notes: 'prior note' },
    } as any);
    vi.mocked(prisma.appointment.update).mockResolvedValue({} as any);

    await PATCH(
      makeRequest({ method: 'PATCH', body: { status: 'COMPLETED', notes: 'flu' } }),
      withParams({ id: 'a-1' }),
    );

    expect(prisma.patient.update).toHaveBeenCalledWith({
      where: { id: 'p-1' },
      data: { notes: expect.stringContaining('Dr Who') },
    });
    const written = vi.mocked(prisma.patient.update).mock.calls[0][0].data.notes as string;
    expect(written).toMatch(/prior note/);
    expect(written).toMatch(/flu/);
  });

  it('does not append notes when notes is empty', async () => {
    setRbac(mockRbac, { authorized: true, role: 'DOCTOR' });
    vi.mocked(prisma.appointment.findUnique).mockResolvedValue({
      id: 'a-1',
      patientId: 'p-1',
      patient: { notes: '' },
    } as any);
    vi.mocked(prisma.appointment.update).mockResolvedValue({} as any);

    await PATCH(
      makeRequest({ method: 'PATCH', body: { status: 'CANCELLED' } }),
      withParams({ id: 'a-1' }),
    );
    expect(prisma.patient.update).not.toHaveBeenCalled();
  });
});
