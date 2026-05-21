import Link from 'next/link';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import NotificationsButton from '@/components/NotificationsButton';

export default async function PatientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);
  
  if (!session || session.user.role !== 'PATIENT') {
    redirect('/api/auth/signin');
  }

  return (
    <div className="min-h-screen bg-slate-50 flex text-slate-900">
      {/* Sidebar Navigation */}
      <aside className="w-64 bg-white shadow-lg hidden md:flex flex-col border-r border-slate-200">
        <div className="p-6 border-b border-slate-100 flex items-center space-x-3">
          <div className="h-8 w-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-xl">
             +
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-slate-800 tracking-tight">ClinicPal</h2>
            <p className="text-xs text-slate-500 font-medium tracking-wide uppercase">Patient Portal</p>
          </div>
        </div>
        
        <nav className="flex-1 p-4 space-y-2 mt-4">
          <Link href="/patient/dashboard" className="block px-4 py-3 rounded-xl hover:bg-slate-50 hover:text-blue-600 transition-all font-semibold text-slate-600">
            Dashboard
          </Link>
          <Link href="/patient/appointments" className="block px-4 py-3 rounded-xl hover:bg-slate-50 hover:text-blue-600 transition-all font-semibold text-slate-600">
            Appointments
          </Link>
          <Link href="/patient/profile" className="block px-4 py-3 rounded-xl hover:bg-slate-50 hover:text-blue-600 transition-all font-semibold text-slate-600">
            Profile Settings
          </Link>
        </nav>
        
        <div className="p-6 border-t border-slate-100">
          <div className="mb-4 px-2">
            <p className="text-sm font-semibold text-slate-800">{session.user.name}</p>
            <p className="text-xs text-slate-500 truncate">{session.user.email}</p>
          </div>
          <a href="/api/auth/signout" className="block w-full text-center px-4 py-2 border border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 rounded-lg transition-colors font-medium">
            Sign Out
          </a>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 h-screen overflow-y-auto w-full">
        {/* Mobile Top Bar */}
        <div className="md:hidden bg-white shadow-sm px-4 py-3 flex justify-between items-center z-10 sticky top-0 gap-3">
          <h2 className="text-lg font-bold text-blue-600">ClinicPal</h2>
          <div className="flex items-center gap-2">
            <nav className="flex space-x-4 text-sm font-medium">
              <Link href="/patient/dashboard">Home</Link>
              <Link href="/patient/appointments">Appts</Link>
              <Link href="/patient/profile">Profile</Link>
            </nav>
            <NotificationsButton />
          </div>
        </div>
        
        <div className="p-6 md:p-10 max-w-6xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
