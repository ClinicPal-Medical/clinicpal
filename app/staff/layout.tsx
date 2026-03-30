import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { LayoutDashboard, Calendar, Users, Package, DollarSign, LogOut } from 'lucide-react';

export default async function StaffLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role === 'PATIENT') {
    redirect('/login');
  }

  const role = session.user.role;
  const isAdmin = role === 'ADMIN';

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <div className="w-64 bg-slate-900 text-white flex flex-col hidden md:flex fixed h-full">
        <div className="p-6">
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center">
            Clinic<span className="text-blue-500">Pal</span> Staff
          </h1>
          <p className="text-xs text-slate-400 font-medium mt-1 uppercase tracking-wider">{role}</p>
        </div>
        
        <nav className="flex-1 px-4 space-y-2 mt-4">
          <Link href="/staff/dashboard" className="flex items-center space-x-3 px-4 py-3 text-slate-300 hover:bg-slate-800 hover:text-white rounded-xl transition-all font-medium">
            <LayoutDashboard size={20} />
            <span>Dashboard</span>
          </Link>
          <Link href="/staff/appointments" className="flex items-center space-x-3 px-4 py-3 text-slate-300 hover:bg-slate-800 hover:text-white rounded-xl transition-all font-medium">
            <Calendar size={20} />
            <span>Appointments</span>
          </Link>
          <Link href="/staff/patients" className="flex items-center space-x-3 px-4 py-3 text-slate-300 hover:bg-slate-800 hover:text-white rounded-xl transition-all font-medium">
            <Users size={20} />
            <span>Patients</span>
          </Link>
          <Link href="/staff/stock" className="flex items-center space-x-3 px-4 py-3 text-slate-300 hover:bg-slate-800 hover:text-white rounded-xl transition-all font-medium">
            <Package size={20} />
            <span>Stock Inventory</span>
          </Link>
          
          {isAdmin && (
            <Link href="/staff/revenue" className="flex items-center space-x-3 px-4 py-3 text-slate-300 hover:bg-slate-800 hover:text-white rounded-xl transition-all font-medium">
              <DollarSign size={20} />
              <span>Revenue</span>
            </Link>
          )}
        </nav>

        <div className="p-4 border-t border-slate-800">
          <Link href="/api/auth/signout" className="flex items-center space-x-3 px-4 py-3 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-xl transition-all font-medium">
            <LogOut size={20} />
            <span>Sign Out</span>
          </Link>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 md:ml-64 p-8 overflow-y-auto">
        <div className="max-w-6xl mx-auto pb-16">
          {children}
        </div>
      </div>
    </div>
  );
}
