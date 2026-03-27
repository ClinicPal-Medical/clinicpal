'use client';

import { useState, useEffect } from 'react';
import { User, Phone, Mail, Save, AlertCircle } from 'lucide-react';

export default function PatientProfilePage() {
  const [profile, setProfile] = useState({ firstName: '', lastName: '', email: '', phone: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  useEffect(() => {
    fetch('/api/patient/profile')
      .then(r => r.json())
      .then(data => {
        setProfile({
          firstName: data.firstName || '',
          lastName: data.lastName || '',
          email: data.email || '',
          phone: data.phone || ''
        });
        setLoading(false);
      });
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setMessage({ text: '', type: '' });
    try {
      const res = await fetch('/api/patient/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profile)
      });
      if (!res.ok) throw new Error('Failed to update');
      setMessage({ text: 'Profile updated successfully.', type: 'success' });
    } catch (err) {
      setMessage({ text: 'Error updating profile.', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-slate-500 font-medium animate-pulse">Loading profile...</div>;

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Patient Profile</h1>
        <p className="text-slate-500 mt-2 font-medium">Manage your personal information and contact details.</p>
      </div>

      <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
        
        {message.text && (
          <div className={`mb-6 p-4 rounded-xl flex items-center font-medium ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
            <AlertCircle size={20} className="mr-2" /> {message.text}
          </div>
        )}

        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">First Name</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User size={18} className="text-slate-400" />
                </div>
                <input 
                  type="text" 
                  value={profile.firstName}
                  onChange={e => setProfile({...profile, firstName: e.target.value})}
                  className="w-full pl-10 p-3.5 border-2 border-slate-200 bg-slate-50 rounded-xl focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none transition-all font-medium text-slate-800"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Last Name</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User size={18} className="text-slate-400" />
                </div>
                <input 
                  type="text" 
                  value={profile.lastName}
                  onChange={e => setProfile({...profile, lastName: e.target.value})}
                  className="w-full pl-10 p-3.5 border-2 border-slate-200 bg-slate-50 rounded-xl focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none transition-all font-medium text-slate-800"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Email Address</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail size={18} className="text-slate-400" />
              </div>
              <input 
                type="email" 
                disabled
                value={profile.email}
                className="w-full pl-10 p-3.5 border-2 border-slate-200 bg-slate-100 text-slate-500 rounded-xl cursor-not-allowed font-medium"
              />
            </div>
            <p className="text-xs text-slate-400 mt-2 font-medium">Email address cannot be changed. Contact support if needed.</p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Phone Number</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Phone size={18} className="text-slate-400" />
              </div>
              <input 
                type="tel" 
                value={profile.phone}
                onChange={e => setProfile({...profile, phone: e.target.value})}
                className="w-full pl-10 p-3.5 border-2 border-slate-200 bg-slate-50 rounded-xl focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none transition-all font-medium text-slate-800"
              />
            </div>
          </div>

          <div className="pt-6 border-t border-slate-100 mt-2">
            <button 
              onClick={handleSave}
              disabled={saving}
              className="w-full sm:w-auto px-8 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold py-3.5 rounded-xl transition-all shadow-md active:scale-95 flex items-center justify-center"
            >
              {saving ? 'Saving...' : <><Save size={18} className="mr-2" /> Save Changes</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
