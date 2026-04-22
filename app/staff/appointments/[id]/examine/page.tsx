import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { getEncounterPage } from '@/modules/encounters/service';
import ExaminationWorkspace from './ExaminationWorkspace';

export default async function ExaminePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getServerSession(authOptions);

  // Guard 1: must be a DOCTOR
  if (!session || session.user.role !== 'DOCTOR') {
    redirect(
      '/staff/appointments?toast=' +
        encodeURIComponent('Access restricted to doctors.')
    );
  }

  const { id: appointmentId } = await params;

  // Guard 2: appointment must be CONFIRMED
  const result = await getEncounterPage(appointmentId, session.user.id);

  if ('error' in result) {
    if (result.error === 'NOT_FOUND') {
      redirect(
        '/staff/appointments?toast=' +
          encodeURIComponent('Appointment not found.')
      );
    }
    if (result.error === 'NOT_CONFIRMED') {
      redirect(
        '/staff/appointments?toast=' +
          encodeURIComponent('This appointment is not currently active.')
      );
    }
  }

  // Serialise Dates to strings for client hydration
  const data = JSON.parse(JSON.stringify(result));

  return <ExaminationWorkspace data={data} />;
}
