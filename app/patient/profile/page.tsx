'use client';

import { useState, useEffect } from 'react';
import { User, Phone, Mail, Save, AlertCircle } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import Button from '@/components/Button';
import TextField from '@/components/TextField';

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
      <PageHeader
        title="Patient Profile"
        subtitle="Manage your personal information and contact details."
      />

      <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
        
        {message.text && (
          <div className={`mb-6 p-4 rounded-xl flex items-center font-medium ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
            <AlertCircle size={20} className="mr-2" /> {message.text}
          </div>
        )}

        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <TextField
              label="First Name"
              type="text"
              icon={User}
              value={profile.firstName}
              onChange={(e) => setProfile({ ...profile, firstName: e.target.value })}
            />
            <TextField
              label="Last Name"
              type="text"
              icon={User}
              value={profile.lastName}
              onChange={(e) => setProfile({ ...profile, lastName: e.target.value })}
            />
          </div>

          <TextField
            label="Email Address"
            type="email"
            icon={Mail}
            disabled
            value={profile.email}
            hint="Email address cannot be changed. Contact support if needed."
          />

          <TextField
            label="Phone Number"
            type="tel"
            icon={Phone}
            value={profile.phone}
            onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
          />

          <div className="pt-6 border-t border-slate-100 mt-2">
            <Button
              onClick={handleSave}
              loading={saving}
              loadingText="Saving..."
              icon={Save}
            >
              Save Changes
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
