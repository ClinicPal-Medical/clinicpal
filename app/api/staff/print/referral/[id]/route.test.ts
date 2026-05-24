import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from './route';
import { requireRole } from '@/lib/rbac';
import * as service from '@/modules/encounters/service';
import { renderToBuffer } from '@react-pdf/renderer';
import { setRbac, makeRequest, withParams } from '@/tests/helpers';

vi.mock('@/lib/rbac', () => ({ requireRole: vi.fn() }));
vi.mock('@/modules/encounters/service', () => ({ getReferralForPrint: vi.fn() }));
vi.mock('@react-pdf/renderer', () => ({ renderToBuffer: vi.fn() }));
vi.mock('@/lib/pdf/ReferralPDF', () => ({ ReferralPDF: () => null }));

const mockRbac = vi.mocked(requireRole);
const params = withParams({ id: 'r-1' });

describe('GET /api/staff/print/referral/[id]', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns the rbac response when not a doctor', async () => {
    setRbac(mockRbac, { authorized: false });
    const res = await GET(makeRequest(), params);
    expect(res.status).toBe(403);
  });

  it('returns 404 when missing', async () => {
    setRbac(mockRbac, { authorized: true, role: 'DOCTOR', id: 'd-1' });
    vi.mocked(service.getReferralForPrint).mockResolvedValue(null as any);
    expect((await GET(makeRequest(), params)).status).toBe(404);
  });

  it('returns 403 when issued by another doctor', async () => {
    setRbac(mockRbac, { authorized: true, role: 'DOCTOR', id: 'd-1' });
    vi.mocked(service.getReferralForPrint).mockResolvedValue({
      id: 'r-1',
      doctorId: 'd-OTHER',
    } as any);
    expect((await GET(makeRequest(), params)).status).toBe(403);
  });

  it('renders a PDF on success', async () => {
    setRbac(mockRbac, { authorized: true, role: 'DOCTOR', id: 'd-1' });
    vi.mocked(service.getReferralForPrint).mockResolvedValue({
      id: 'r-1',
      doctorId: 'd-1',
    } as any);
    vi.mocked(renderToBuffer).mockResolvedValue(Buffer.from('pdf') as any);

    const res = await GET(makeRequest(), params);
    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toBe('application/pdf');
    expect(res.headers.get('Content-Disposition')).toContain('referral-r-1.pdf');
  });
});
