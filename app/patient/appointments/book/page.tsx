'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { User, Calendar, Clock, CheckCircle } from 'lucide-react';

type Staff = { id: string; name: string; specialisation: string };

function BookAppointmentContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedStaffId = searchParams.get('staffId');

  const [step, setStep] = useState(1);
  const [doctorsList, setDoctorsList] = useState<Staff[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<Staff | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<string>('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch('/api/doctors').then(r => r.json()).then((list: Staff[]) => {
      setDoctorsList(list);
      if (preselectedStaffId) {
        const match = list.find(d => d.id === preselectedStaffId);
        if (match) setSelectedDoctor(match);
      }
    });
  }, [preselectedStaffId]);

  const fetchSlots = async (staffId: string, date: string) => {
    const res = await fetch(`/api/appointments/slots?staffId=${staffId}&date=${date}`);
    const data = await res.json();
    setAvailableSlots(data);
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const date = e.target.value;
    setSelectedDate(date);
    setSelectedSlot('');
    if (selectedDoctor) fetchSlots(selectedDoctor.id, date);
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          staffId: selectedDoctor?.id,
          scheduledAt: selectedSlot,
          reason
        })
      });
      if (!res.ok) throw new Error('Failed to book');
      router.push('/patient/appointments');
    } catch (err) {
      alert('Error booking appointment.');
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Book Appointment</h1>
        <p className="text-slate-500 mt-2 font-medium">Follow the steps below to schedule a visit.</p>
      </div>

      <div className="flex items-center justify-between mb-8 relative">
        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-slate-200 z-0 rounded-full"></div>
        <div
          className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-blue-600 z-0 rounded-full transition-all duration-500"
          style={{ width: `${(step - 1) * 50}%` }}
        ></div>

        {[1, 2, 3].map(i => (
          <div key={i} className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center font-bold transition-colors ${step >= i ? 'bg-blue-600 text-white' : 'bg-white border-2 border-slate-200 text-slate-400'}`}>
            {step > i ? <CheckCircle size={20} /> : i}
          </div>
        ))}
      </div>

      <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 flex flex-col min-h-100">
        {step === 1 && (
          <div className="space-y-6 animate-in fade-in flex-1 flex flex-col">
            <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center"><User className="mr-2" /> Select Practitioner</h2>
            <div className="grid gap-4 flex-1">
              {doctorsList.map(doctor => (
                <button
                  key={doctor.id}
                  onClick={() => setSelectedDoctor(doctor)}
                  className={`p-4 rounded-xl text-left border-2 transition-all ${selectedDoctor?.id === doctor.id ? 'border-blue-600 bg-blue-50' : 'border-slate-100 hover:border-blue-300'}`}
                >
                  <div className="font-bold text-slate-800 text-lg">{doctor.name}</div>
                  <div className="text-sm font-medium text-slate-500">{doctor.specialisation}</div>
                </button>
              ))}
              {doctorsList.length === 0 && <p className="text-slate-500 font-medium py-8 text-center bg-slate-50 rounded-xl border border-slate-100">Loading practitioners...</p>}
            </div>
            <button
              disabled={!selectedDoctor}
              onClick={() => setStep(2)}
              className="mt-8 w-full bg-blue-600 disabled:bg-slate-300 hover:bg-blue-700 text-white font-semibold py-3.5 rounded-xl transition-colors"
            >
              Continue to Schedule
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6 animate-in slide-in-from-right-4 fade-in flex-1 flex flex-col">
            <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center"><Calendar className="mr-2 text-blue-600" /> Select Date & Time</h2>
            <div className="flex-1">
              <label className="block text-sm font-semibold text-slate-700 mb-2">Date</label>
              <input
                type="date"
                min={new Date().toISOString().split('T')[0]}
                value={selectedDate}
                onChange={handleDateChange}
                className="w-full p-3.5 border-2 border-slate-200 bg-slate-50 rounded-xl focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100 outline-none transition-all font-medium text-slate-700"
              />

              {selectedDate && (
                <div className="mt-6">
                  <label className="block text-sm font-semibold text-slate-700 mb-3">Available Slots</label>
                  {availableSlots.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {availableSlots.map(slot => {
                        const timeStr = new Date(slot).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                        return (
                          <button
                            key={slot}
                            onClick={() => setSelectedSlot(slot)}
                            className={`p-3 rounded-xl font-bold text-sm flex items-center justify-center border-2 transition-colors ${selectedSlot === slot ? 'border-blue-600 bg-blue-600 text-white shadow-md' : 'border-slate-200 hover:border-blue-300 text-slate-700 bg-white'}`}
                          >
                            <Clock size={16} className={`mr-2 ${selectedSlot === slot ? 'opacity-100' : 'opacity-60'}`} /> {timeStr}
                          </button>
                        )
                      })}
                    </div>
                  ) : (
                    <div className="text-center p-8 bg-slate-50 rounded-xl border-2 border-slate-100 border-dashed">
                       <Calendar size={32} className="mx-auto text-slate-400 mb-3" />
                       <p className="text-slate-600 font-medium">No slots available on this date. Please try another day.</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex space-x-4 mt-8 pt-4 border-t border-slate-100">
              <button onClick={() => setStep(1)} className="w-1/3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-3.5 rounded-xl transition-colors">Back</button>
              <button
                disabled={!selectedSlot}
                onClick={() => setStep(3)}
                className="w-2/3 bg-blue-600 disabled:bg-slate-300 hover:bg-blue-700 disabled:hover:bg-slate-300 text-white font-semibold py-3.5 rounded-xl transition-colors shadow-sm"
              >
                Review & Confirm
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6 animate-in slide-in-from-right-4 fade-in flex-1 flex flex-col">
            <h2 className="text-xl font-bold text-blue-600 mb-4 flex items-center"><CheckCircle className="mr-2" /> Review Details</h2>

            <div className="flex-1">
              <div className="bg-blue-50/50 p-6 rounded-2xl border border-blue-100 space-y-6">
                <div>
                  <div className="text-xs font-bold text-blue-500 uppercase tracking-widest mb-1">Practitioner</div>
                  <div className="text-lg font-bold text-slate-800 flex items-center">
                    <User size={18} className="mr-2 text-slate-400" />
                    {selectedDoctor?.name} <span className="ml-2 py-0.5 px-2 bg-white rounded-md text-xs font-semibold text-slate-500 shadow-sm border border-slate-100">{selectedDoctor?.specialisation}</span>
                  </div>
                </div>
                <div>
                  <div className="text-xs font-bold text-blue-500 uppercase tracking-widest mb-1">Date & Time</div>
                  <div className="text-xl font-black text-blue-700 flex items-center">
                    <Calendar size={20} className="mr-2" />
                    {new Date(selectedSlot).toLocaleString([], { weekday: 'long', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>

              <div className="mt-8">
                <label className="block text-sm font-semibold text-slate-700 mb-2">Reason for Visit <span className="text-slate-400 font-normal">(Optional)</span></label>
                <textarea
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                  rows={3}
                  placeholder="Briefly describe your symptoms or reason for the appointment..."
                  className="w-full p-4 border-2 border-slate-200 bg-slate-50 rounded-xl focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none transition-all resize-none font-medium placeholder:text-slate-400 text-slate-800"
                ></textarea>
              </div>
            </div>

            <div className="flex space-x-4 mt-8 pt-4 border-t border-slate-100">
              <button disabled={loading} onClick={() => setStep(2)} className="w-1/3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-3.5 rounded-xl transition-colors">Back</button>
              <button
                disabled={loading}
                onClick={handleSubmit}
                className="w-2/3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-wait text-white font-bold py-3.5 rounded-xl transition-colors flex justify-center items-center shadow-md active:scale-95"
              >
                {loading ? 'Confirming...' : 'Confirm Appointment'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function BookAppointmentPage() {
  return (
    <Suspense>
      <BookAppointmentContent />
    </Suspense>
  );
}
