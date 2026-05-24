import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from './route';
import { requireRole } from '@/lib/rbac';
import * as service from '@/modules/encounters/service';
import { renderToBuffer } from '@react-pdf/renderer';
import { setRbac, makeRequest, withParams } from '@/tests/helpers';

vi.mock('@/lib/rbac', () => ({ requireRole: vi.fn() }));
vi.mock('@/modules/encounters/service', () => ({ getCertificateForPrint: vi.fn() }));
vi.mock('@react-pdf/renderer', () => ({ renderToBuffer: vi.fn() }));
vi.mock('@/lib/pdf/MedicalCertificatePDF', () => ({ MedicalCertificatePDF: () => null }));

const mockRbac = vi.mocked(requireRole);
const params = withParams({ id: 'c-1' });

describe('GET /api/staff/print/certificate/[id]', () => {
  beforeEach(() => vi.clearAllMocks());

  it('returns the rbac response when not a doctor', async () => {
    setRbac(mockRbac, { authorized: false });
    const res = await GET(makeRequest(), params);
    expect(res.status).toBe(403);
  });

  it('returns 404 when the certificate is missing', async () => {
    setRbac(mockRbac, { authorized: true, role: 'DOCTOR', id: 'd-1' });
    vi.mocked(service.getCertificateForPrint).mockResolvedValue(null as any);
    expect((await GET(makeRequest(), params)).status).toBe(404);
  });

  it('returns 403 when issued by another doctor', async () => {
    setRbac(mockRbac, { authorized: true, role: 'DOCTOR', id: 'd-1' });
    vi.mocked(service.getCertificateForPrint).mockResolvedValue({
      id: 'c-1',
      doctorId: 'd-OTHER',
    } as any);
    expect((await GET(makeRequest(), params)).status).toBe(403);
  });

  it('renders a PDF on success', async () => {
    setRbac(mockRbac, { authorized: true, role: 'DOCTOR', id: 'd-1' });
    vi.mocked(service.getCertificateForPrint).mockResolvedValue({
      id: 'c-1',
      doctorId: 'd-1',
    } as any);
    vi.mocked(renderToBuffer).mockResolvedValue(Buffer.from('pdf') as any);

    const res = await GET(makeRequest(), params);
    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toBe('application/pdf');
    expect(res.headers.get('Content-Disposition')).toContain('certificate-c-1.pdf');
  });
});
