'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { User, Mail, Lock, Phone } from 'lucide-react';
import Button from '@/components/Button';
import { TextInput, DateInput } from '@/components/form';

const signupSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().min(1, 'Email is required').email('Invalid email address'),
  password: z.string().min(8, 'Must be at least 8 characters'),
  dob: z.string().min(1, 'Date of birth is required'),
  phone: z.string().optional(),
});

type FormValues = z.infer<typeof signupSchema>;

export default function SignupPage() {
  const router = useRouter();
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const {
    control,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      dob: '',
      phone: '',
    },
  });

  const onSubmit = async (data: FormValues) => {
    setError('');
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const body = await res.json();
        setError(body.error || 'Failed to register');
        return;
      }

      setSuccess(true);
      setTimeout(() => router.push('/login'), 2000);
    } catch {
      setError('An unexpected error occurred.');
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="w-full max-w-md bg-white rounded-3xl shadow-xl overflow-hidden animate-in fade-in duration-700 p-10 text-center">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 text-2xl font-black">✓</div>
          <h2 className="text-2xl font-black text-slate-900 mb-2">Registration Successful!</h2>
          <p className="text-slate-500 font-medium">Redirecting you to login...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4 py-12">
      <div className="w-full max-w-xl bg-white rounded-3xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-bottom-8 duration-700">
        <div className="p-10">
          <h2 className="text-3xl font-extrabold text-slate-900 text-center tracking-tight mb-2">Join ClinicPal</h2>
          <p className="text-center text-slate-500 font-medium mb-8">Create your patient portal account.</p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {error && (
              <div className="p-4 bg-red-50 text-red-600 border border-red-100 rounded-xl text-sm font-semibold text-center">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <TextInput
                control={control}
                name="firstName"
                label="First Name"
                placeholder="John"
                leftIcon={User}
                autoComplete="given-name"
              />
              <TextInput
                control={control}
                name="lastName"
                label="Last Name"
                placeholder="Doe"
                leftIcon={User}
                autoComplete="family-name"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <TextInput
                control={control}
                name="email"
                type="email"
                label="Email Address"
                placeholder="john@example.com"
                leftIcon={Mail}
                autoComplete="email"
              />
              <TextInput
                control={control}
                name="password"
                type="password"
                label="Password"
                placeholder="••••••••"
                leftIcon={Lock}
                autoComplete="new-password"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <DateInput
                control={control}
                name="dob"
                variant="date"
                label="Date of Birth"
                max={new Date().toISOString().split('T')[0]}
              />
              <TextInput
                control={control}
                name="phone"
                type="tel"
                label="Phone (Optional)"
                placeholder="(555) 123-4567"
                leftIcon={Phone}
                autoComplete="tel"
              />
            </div>

            <Button
              type="submit"
              size="lg"
              fullWidth
              loading={isSubmitting}
              loadingText="Creating account..."
              className="mt-4"
            >
              Create Account
            </Button>
          </form>

          <div className="mt-8 text-center">
             <p className="text-sm font-medium text-slate-500">
               Already have an account? <Link href="/login" className="text-blue-600 font-bold hover:underline">Sign In</Link>
             </p>
          </div>
        </div>
      </div>
    </div>
  );
}
