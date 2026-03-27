import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db';
import Link from 'next/link';
import { Calendar, ArrowRight, User } from 'lucide-react';

export default async function PatientDashboard() {
  const session = await getServerSession(authOptions);
  
  const nextAppt = await prisma.appointment.findFirst({
    where: {
      patientId: session?.user?.id,
      scheduledAt: { gt: new Date() },
      status: { in: ['PENDING', 'CONFIRMED'] }
    },
    include: { staff: true },
    orderBy: { scheduledAt: 'asc' }
  });

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          Welcome back, {session?.user?.name?.split(' ')[0]}!
        </h1>
        <p className="text-slate-500 mt-2 font-medium">Here's an overview of your health schedule.</p>
      </div>

      <div className="grid grid-cols-1 gap-6 max-w-2xl">
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
      </div>
    </div>
  );
}
