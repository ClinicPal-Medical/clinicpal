'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { User, Phone, Mail, Save, AlertCircle } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import Button from '@/components/Button';
import { TextInput } from '@/components/form';

const profileSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string(),
  phone: z.string().optional().or(z.literal('')),
});

type FormValues = z.infer<typeof profileSchema>;

export default function PatientProfilePage() {
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ text: '', type: '' });
  const {
    control,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: { firstName: '', lastName: '', email: '', phone: '' },
  });

  useEffect(() => {
    fetch('/api/patient/profile')
      .then((r) => r.json())
      .then((data) => {
        reset({
          firstName: data.firstName || '',
          lastName: data.lastName || '',
          email: data.email || '',
          phone: data.phone || '',
        });
        setLoading(false);
      });
  }, [reset]);

  const onSubmit = async (values: FormValues) => {
    setMessage({ text: '', type: '' });
    try {
      const res = await fetch('/api/patient/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });
      if (!res.ok) throw new Error('Failed to update');
      setMessage({ text: 'Profile updated successfully.', type: 'success' });
    } catch {
      setMessage({ text: 'Error updating profile.', type: 'error' });
    }
  };

  if (loading) return <div className="p-8 text-center text-slate-500 font-medium animate-pulse">Loading profile...</div>;

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <PageHeader
        title="Patient Profile"
        subtitle="Manage your personal information and contact details."
      />

      <form onSubmit={handleSubmit(onSubmit)} className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
        {message.text && (
          <div className={`mb-6 p-4 rounded-xl flex items-center font-medium ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
            <AlertCircle size={20} className="mr-2" /> {message.text}
          </div>
        )}

        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <TextInput
              control={control}
              name="firstName"
              label="First Name"
              leftIcon={User}
              autoComplete="given-name"
            />
            <TextInput
              control={control}
              name="lastName"
              label="Last Name"
              leftIcon={User}
              autoComplete="family-name"
            />
          </div>

          <TextInput
            control={control}
            name="email"
            type="email"
            label="Email Address"
            leftIcon={Mail}
            disabled
            hint="Email address cannot be changed. Contact support if needed."
            autoComplete="email"
          />

          <TextInput
            control={control}
            name="phone"
            type="tel"
            label="Phone Number"
            leftIcon={Phone}
            autoComplete="tel"
          />

          <div className="pt-6 border-t border-slate-100 mt-2">
            <Button
              type="submit"
              loading={isSubmitting}
              loadingText="Saving..."
              icon={Save}
            >
              Save Changes
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}
