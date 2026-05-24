import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from './route';
import { requireRole } from '@/lib/rbac';
import * as service from '@/modules/encounters/service';
import { renderToBuffer } from '@react-pdf/renderer';
import { setRbac, makeRequest, withParams } from '@/tests/helpers';

vi.mock('@/lib/rbac', () => ({ requireRole: vi.fn() }));
vi.mock('@/modules/encounters/service', () => ({ getPrescriptionForPrint: vi.fn() }));
vi.mock('@react-pdf/renderer', () => ({ renderToBuffer: vi.fn() }));
vi.mock('@/lib/pdf/PrescriptionPDF', () => ({ PrescriptionPDF: () => null }));

const mockRbac = vi.mocked(requireRole);
const params = withParams({ id: 'rx-1' });

describe('GET /api/staff/print/prescription/[id]', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns the rbac response when not a doctor', async () => {
    setRbac(mockRbac, { authorized: false });
    const res = await GET(makeRequest(), params);
    expect(res.status).toBe(403);
  });

  it('returns 404 when the prescription is missing', async () => {
    setRbac(mockRbac, { authorized: true, role: 'DOCTOR', id: 'd-1' });
    vi.mocked(service.getPrescriptionForPrint).mockResolvedValue(null as any);
    const res = await GET(makeRequest(), params);
    expect(res.status).toBe(404);
  });

  it('returns 403 when the prescription was issued by a different doctor', async () => {
    setRbac(mockRbac, { authorized: true, role: 'DOCTOR', id: 'd-1' });
    vi.mocked(service.getPrescriptionForPrint).mockResolvedValue({
      id: 'rx-1',
      doctorId: 'd-OTHER',
    } as any);
    const res = await GET(makeRequest(), params);
    expect(res.status).toBe(403);
  });

  it('renders a PDF response on success', async () => {
    setRbac(mockRbac, { authorized: true, role: 'DOCTOR', id: 'd-1' });
    vi.mocked(service.getPrescriptionForPrint).mockResolvedValue({
      id: 'rx-1',
      doctorId: 'd-1',
    } as any);
    vi.mocked(renderToBuffer).mockResolvedValue(Buffer.from('pdf-bytes') as any);

    const res = await GET(makeRequest(), params);
    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toBe('application/pdf');
    expect(res.headers.get('Content-Disposition')).toContain('prescription-rx-1.pdf');
  });
});
