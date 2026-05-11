import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db';
import Link from 'next/link';
import { Calendar, ArrowRight, User, History, RotateCcw } from 'lucide-react';

const STATUS_STYLES: Record<string, string> = {
  CONFIRMED: 'bg-green-100 text-green-700',
  PENDING: 'bg-amber-100 text-amber-700',
  CANCELLED: 'bg-red-100 text-red-700',
  COMPLETED: 'bg-slate-100 text-slate-600',
};

export default async function PatientDashboard() {
  const session = await getServerSession(authOptions);

  const [nextAppt, recentAppts] = await Promise.all([
    prisma.appointment.findFirst({
      where: {
        patientId: session?.user?.id,
        scheduledAt: { gt: new Date() },
        status: { in: ['PENDING', 'CONFIRMED'] }
      },
      include: { staff: true },
      orderBy: { scheduledAt: 'asc' }
    }),
    prisma.appointment.findMany({
      where: {
        patientId: session?.user?.id,
        scheduledAt: { lt: new Date() },
      },
      include: { staff: { select: { id: true, name: true, specialisation: true } } },
      orderBy: { scheduledAt: 'desc' },
      take: 3,
    }),
  ]);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          Welcome back, {session?.user?.name?.split(' ')[0]}!
        </h1>
        <p className="text-slate-500 mt-2 font-medium">Here's an overview of your health schedule.</p>
      </div>

      <div className="grid grid-cols-1 gap-6 max-w-2xl">
        {/* Next Visit */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex flex-col relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:scale-110 transition-transform duration-500">
            <Calendar size={120} />
          </div>
          <div className="flex items-center space-x-3 mb-6 relative z-10">
            <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
              <Calendar size={20} />
            </div>
            <h2 className="text-lg font-bold text-slate-800">Your Next Visit</h2>
          </div>

          <div className="flex-1 relative z-10">
            {nextAppt ? (
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <p className="text-sm text-slate-500 font-medium mb-1">
                  {new Date(nextAppt.scheduledAt).toLocaleDateString('en-US', { weekday: 'short', month: 'long', day: 'numeric' })}
                </p>
                <p className="text-xl font-bold text-slate-800 mb-2">
                  {new Date(nextAppt.scheduledAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                </p>
                <div className="flex items-center space-x-2 text-sm text-slate-600">
                  <User size={16} />
                  <span>{nextAppt.staff.name}</span>
                </div>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center py-6 text-center">
                <p className="text-slate-500 mb-4 font-medium">You have no upcoming appointments.</p>
                <Link
                  href="/patient/appointments/book"
                  className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-2.5 rounded-xl transition-all shadow-sm hover:shadow active:scale-95"
                >
                  Book an Appointment
                </Link>
              </div>
            )}
          </div>

          {nextAppt && (
             <div className="mt-6 flex justify-end relative z-10">
               <Link href="/patient/appointments" className="text-sm font-semibold text-blue-600 hover:text-blue-800 flex items-center transition-colors">
                 Manage <ArrowRight size={16} className="ml-1" />
               </Link>
             </div>
          )}
        </div>

        {/* Recent Visits */}
        {recentAppts.length > 0 && (
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center space-x-3">
                <div className="h-10 w-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-500">
                  <History size={20} />
                </div>
                <h2 className="text-lg font-bold text-slate-800">Recent Visits</h2>
              </div>
              <Link href="/patient/appointments" className="text-sm font-semibold text-blue-600 hover:text-blue-800 flex items-center transition-colors">
                View all <ArrowRight size={16} className="ml-1" />
              </Link>
            </div>

            <div className="divide-y divide-slate-100">
              {recentAppts.map((appt) => {
                const date = new Date(appt.scheduledAt);
                const statusStyle = STATUS_STYLES[appt.status] ?? 'bg-slate-100 text-slate-600';
                return (
                  <div key={appt.id} className="py-4 first:pt-0 last:pb-0 flex items-center justify-between gap-4">
                    <div className="flex items-center space-x-4 min-w-0">
                      <div className="shrink-0 h-10 w-10 bg-slate-50 rounded-xl flex flex-col items-center justify-center border border-slate-100">
                        <span className="text-xs font-bold text-slate-500 leading-none">
                          {date.toLocaleDateString('en-US', { month: 'short' }).toUpperCase()}
                        </span>
                        <span className="text-lg font-extrabold text-slate-700 leading-tight">
                          {date.getDate()}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center space-x-2 text-sm font-bold text-slate-800 truncate">
                          <User size={14} className="shrink-0 text-slate-400" />
                          <span className="truncate">{appt.staff.name}</span>
                        </div>
                        <div className="flex items-center space-x-2 mt-0.5">
                          <span className="text-xs text-slate-500">
                            {appt.staff.specialisation}
                          </span>
                          <span className={`px-2 py-0.5 rounded-full text-xs font-bold uppercase tracking-wide ${statusStyle}`}>
                            {appt.status}
                          </span>
                        </div>
                      </div>
                    </div>
                    <Link
                      href={`/patient/appointments/book?staffId=${appt.staff.id}`}
                      className="shrink-0 flex items-center space-x-1.5 text-sm font-semibold text-blue-600 hover:text-white hover:bg-blue-600 border border-blue-200 hover:border-blue-600 px-3 py-1.5 rounded-lg transition-all"
                    >
                      <RotateCcw size={14} />
                      <span>Rebook</span>
                    </Link>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
