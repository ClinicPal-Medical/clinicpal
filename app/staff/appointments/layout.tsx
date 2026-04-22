import { Suspense } from 'react';
import ToastBanner from './ToastBanner';

/**
 * Additive layout wrapper for /staff/appointments.
 * Reads ?toast= from the URL and shows a transient banner.
 * Does not modify the appointments page component itself.
 */
export default function AppointmentsLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Suspense>
        <ToastBanner />
      </Suspense>
      {children}
    </>
  );
}
