'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Search, UserCircle, BriefcaseMedical, CalendarDays, X, Mail, Phone, Calendar } from 'lucide-react';

export default function PatientsDirectory() {
  const { data: session } = useSession();
  const role = session?.user?.role;
  const isMedical = role === 'DOCTOR' || role === 'ADMIN';

  const [query, setQuery] = useState('');
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [activePatient, setActivePatient] = useState<any>(null);
  const [patientDetails, setPatientDetails] = useState<any>(null);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchPatients();
    }, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  const fetchPatients = async () => {
    setLoading(true);
    const res = await fetch(`/api/staff/patients?q=${encodeURIComponent(query)}`);
    const data = await res.json();
    setPatients(data);
    setLoading(false);
  };

  const openPatient = async (patient: any) => {
    setActivePatient(patient);
    const res = await fetch(`/api/staff/patients/${patient.id}`);
    const data = await res.json();
    setPatientDetails(data);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 relative">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Patient Directory</h1>
        <p className="text-slate-500 mt-1 font-medium">Search records, view history, and manage clinical data.</p>
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-4 top-4 text-slate-400" size={20} />
        <input 
          type="text" 
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name, email, or phone..."
          className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-2xl shadow-sm text-slate-700 font-medium outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all"
        />
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-sm pb-4">
                <th className="p-4 font-bold text-slate-600">Patient Details</th>
                <th className="p-4 font-bold text-slate-600 hidden md:table-cell">Contact Info</th>
                <th className="p-4 font-bold text-slate-600">Last Encounter</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
               {loading ? (
                 <tr><td colSpan={3} className="p-8 text-center text-slate-400 font-medium">Searching records...</td></tr>
               ) : patients.length === 0 ? (
                 <tr><td colSpan={3} className="p-8 text-center text-slate-400 font-medium bg-slate-50/50">No patients found.</td></tr>
               ) : patients.map(p => (
                 <tr 
                   key={p.id} 
                   onClick={() => openPatient(p)}
                   className="hover:bg-slate-50 cursor-pointer transition-colors group"
                 >
                   <td className="p-4">
                     <div className="flex items-center space-x-3">
                       <div className="h-10 w-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold text-lg">
                         {p.firstName[0]}{p.lastName[0]}
                       </div>
                       <div>
                         <p className="font-bold text-slate-800">{p.firstName} {p.lastName}</p>
                         <p className="text-xs text-slate-500 font-medium mt-0.5">DOB: {new Date(p.dob).toLocaleDateString()}</p>
                       </div>
                     </div>
                   </td>
                   <td className="p-4 hidden md:table-cell">
                     <p className="text-sm font-medium text-slate-700">{p.email}</p>
                     <p className="text-xs text-slate-500 mt-1">{p.phone}</p>
                   </td>
                   <td className="p-4">
                     {p.appointments?.length > 0 ? (
                       <p className="text-sm font-bold text-slate-700 bg-slate-100 inline-block px-3 py-1 rounded-lg">
                         {new Date(p.appointments[0].scheduledAt).toLocaleDateString()}
                       </p>
                     ) : (
                       <span className="text-xs text-slate-400 font-medium px-3 py-1 border border-slate-200 rounded-lg">No visits</span>
                     )}
                   </td>
                 </tr>
               ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Patient Drawer / Modal */}
      {activePatient && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-slate-900/20 backdrop-blur-sm transition-opacity" onClick={() => {setActivePatient(null); setPatientDetails(null);}}></div>
          <div className="relative w-full max-w-2xl bg-white shadow-2xl h-full flex flex-col animate-in slide-in-from-right duration-300">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/80 backdrop-blur-md">
              <div className="flex items-center space-x-4">
                <div className="h-14 w-14 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-black text-xl">
                  {activePatient.firstName[0]}{activePatient.lastName[0]}
                </div>
                <div>
                  <h2 className="text-2xl font-extrabold text-slate-900">{activePatient.firstName} {activePatient.lastName}</h2>
                  <p className="text-sm text-slate-500 font-medium">Unique ID: {activePatient.id}</p>
                </div>
              </div>
              <button onClick={() => {setActivePatient(null); setPatientDetails(null);}} className="p-2 hover:bg-slate-200 rounded-full transition-colors text-slate-500">
                <X size={24} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-8">
              {!patientDetails ? (
                <div className="flex justify-center items-center h-40 text-slate-400 font-medium">Loading full profile...</div>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-4">
                     <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-center gap-3">
                       <Mail size={18} className="text-slate-400"/>
                       <span className="text-slate-700 font-medium text-sm">{patientDetails.email}</span>
                     </div>
                     <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-center gap-3">
                       <Phone size={18} className="text-slate-400"/>
                       <span className="text-slate-700 font-medium text-sm">{patientDetails.phone}</span>
                     </div>
                  </div>

                  {isMedical && (
                    <div className="p-6 rounded-2xl bg-amber-50/50 border-2 border-amber-100 relative">
                       <div className="absolute -top-3 left-4 bg-white px-2 flex items-center gap-2 text-amber-600 font-bold text-sm">
                         <BriefcaseMedical size={16}/> Clinical Notes
                       </div>
                       <p className="whitespace-pre-wrap text-sm text-slate-700 leading-relaxed pt-2">
                         {patientDetails.notes || "No clinical history recorded."}
                       </p>
                    </div>
                  )}

                  <div>
                     <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2"><Calendar size={20} className="text-blue-500"/> Appointment History</h3>
                     {patientDetails.appointments?.length > 0 ? (
                       <div className="space-y-3">
                         {patientDetails.appointments.map((a: any) => (
                           <div key={a.id} className="p-4 rounded-xl border border-slate-100 flex justify-between items-center bg-white shadow-sm">
                             <div>
                               <p className="font-bold text-slate-800">{new Date(a.scheduledAt).toLocaleDateString()} at {new Date(a.scheduledAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                               <p className="text-xs text-slate-500 font-medium mt-1">Processed by {a.staff?.name}</p>
                             </div>
                             <span className="px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600">
                               {a.status}
                             </span>
                           </div>
                         ))}
                       </div>
                     ) : (
                       <p className="text-sm text-slate-500">No appointments recorded.</p>
                     )}
                  </div>

                  <div>
                     <h3 className="text-lg font-bold text-slate-900 mb-4">Billing & Invoices</h3>
                     {patientDetails.invoices?.length > 0 ? (
                       <div className="space-y-3">
                         {patientDetails.invoices.map((inv: any) => (
                           <div key={inv.id} className="p-4 rounded-xl border border-slate-100 flex justify-between items-center bg-white shadow-sm">
                             <div>
                               <p className="font-bold text-slate-800">${inv.amount.toFixed(2)}</p>
                               <p className="text-xs text-slate-500 font-medium mt-1">Issued: {new Date(inv.issuedAt).toLocaleDateString()}</p>
                             </div>
                             <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider ${
                               inv.status === 'PAID' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                             }`}>
                               {inv.status}
                             </span>
                           </div>
                         ))}
                       </div>
                     ) : (
                       <p className="text-sm text-slate-500">No invoices recorded.</p>
                     )}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
