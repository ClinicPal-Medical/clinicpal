'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Calendar, Clock, User, XCircle, Plus } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import StatusBadge from '@/components/StatusBadge';

type Appointment = {
  id: string;
  scheduledAt: string;
  status: string;
  staff: { name: string };
};

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAppts = async () => {
    try {
      const res = await fetch('/api/appointments');
      const data = await res.json();
      setAppointments(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppts();
  }, []);

  const handleCancel = async (id: string) => {
    if (!confirm('Are you sure you want to cancel this appointment?')) return;
    try {
      const res = await fetch(`/api/appointments/${id}/cancel`, { method: 'PATCH' });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      fetchAppts();
    } catch (err: any) {
      alert(err.message);
    }
  };

  if (loading) return <div className="p-8 text-center text-slate-500 font-medium animate-pulse">Loading appointments...</div>;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <PageHeader
        title="Appointments"
        subtitle="View and manage your schedule."
        actions={
          <Link
            href="/patient/appointments/book"
            className="inline-flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white font-semibold px-5 py-2.5 rounded-xl shadow-sm hover:shadow transition-all"
          >
            <Plus size={18} className="mr-2" />
            Book New
          </Link>
        }
      />

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        {appointments.length === 0 ? (
          <div className="p-12 text-center">
            <div className="mx-auto w-16 h-16 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mb-4">
               <Calendar size={32} />
            </div>
            <p className="text-slate-500 font-medium">You have no appointments history.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {appointments.map((appt) => {
              const date = new Date(appt.scheduledAt);
              const isUpcoming = date > new Date() && appt.status !== 'CANCELLED';
              const isCancellable = isUpcoming && (date.getTime() - Date.now()) > 2 * 60 * 60 * 1000;

              return (
                <div key={appt.id} className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/50 transition-colors">
                  <div className="flex items-start space-x-4">
                    <div className={`p-3 rounded-xl ${isUpcoming ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-500'}`}>
                       <Calendar size={24} />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-800 text-lg">
                        {date.toLocaleDateString('en-US', { weekday: 'short', month: 'long', day: 'numeric' })}
                      </h3>
                      <div className="flex items-center space-x-4 mt-2 text-sm text-slate-600 font-medium">
                        <span className="flex items-center"><Clock size={14} className="mr-1" /> {date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        <span className="flex items-center"><User size={14} className="mr-1" /> {appt.staff.name}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <StatusBadge status={appt.status} />
                    
                    {isCancellable && (
                      <button 
                        onClick={() => handleCancel(appt.id)}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded-lg transition-colors"
                        title="Cancel Appointment"
                      >
                        <XCircle size={20} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
