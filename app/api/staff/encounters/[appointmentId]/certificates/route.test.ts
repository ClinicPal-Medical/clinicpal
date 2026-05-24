import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from './route';
import { requireRole } from '@/lib/rbac';
import * as service from '@/modules/encounters/service';
import { setRbac, makeRequest, withParams, expectJson } from '@/tests/helpers';

vi.mock('@/lib/rbac', () => ({ requireRole: vi.fn() }));
vi.mock('@/modules/encounters/service', () => ({ createCertificate: vi.fn() }));

const mockRbac = vi.mocked(requireRole);

describe('POST /api/staff/encounters/[appointmentId]/certificates', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns the rbac response when not a doctor', async () => {
    setRbac(mockRbac, { authorized: false });
    const res = await POST(
      makeRequest({ method: 'POST', body: {} }),
      withParams({ appointmentId: 'a-1' }),
    );
    expect(res.status).toBe(403);
  });

  it('returns 404 when the encounter is missing', async () => {
    setRbac(mockRbac, { authorized: true, role: 'DOCTOR' });
    vi.mocked(service.createCertificate).mockResolvedValue({ error: 'NOT_FOUND' } as any);
    await expectJson(
      await POST(
        makeRequest({ method: 'POST', body: { fromDate: '2026-01-01', toDate: '2026-01-05' } }),
        withParams({ appointmentId: 'a-x' }),
      ),
      404,
    );
  });

  it('parses the date strings into Date objects', async () => {
    setRbac(mockRbac, { authorized: true, role: 'DOCTOR', id: 'd-1' });
    vi.mocked(service.createCertificate).mockResolvedValue({ id: 'c-1' } as any);

    await POST(
      makeRequest({
        method: 'POST',
        body: {
          diagnosis: 'Flu',
          fitForWork: false,
          fromDate: '2026-07-01',
          toDate: '2026-07-05',
          notes: 'rest',
        },
      }),
      withParams({ appointmentId: 'a-1' }),
    );

    const call = vi.mocked(service.createCertificate).mock.calls[0];
    expect(call[0]).toBe('a-1');
    expect(call[1]).toBe('d-1');
    expect(call[2].fromDate).toBeInstanceOf(Date);
    expect(call[2].toDate).toBeInstanceOf(Date);
    expect(call[2].diagnosis).toBe('Flu');
  });

  it('returns 201 with the certificate', async () => {
    setRbac(mockRbac, { authorized: true, role: 'DOCTOR' });
    const cert = { id: 'c-1' };
    vi.mocked(service.createCertificate).mockResolvedValue(cert as any);
    const body = await expectJson(
      await POST(
        makeRequest({
          method: 'POST',
          body: { fromDate: '2026-01-01', toDate: '2026-01-05' },
        }),
        withParams({ appointmentId: 'a-1' }),
      ),
      201,
    );
    expect(body).toEqual(cert);
  });
});
