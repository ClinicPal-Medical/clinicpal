'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Button from '@/components/Button';
import TextField from '@/components/TextField';

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
    register,
    handleSubmit,
    formState: { isSubmitting, errors },
  } = useForm<FormValues>({ resolver: zodResolver(signupSchema) });

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
              <TextField
                label="First Name"
                type="text"
                placeholder="John"
                error={errors.firstName?.message}
                {...register('firstName')}
              />
              <TextField
                label="Last Name"
                type="text"
                placeholder="Doe"
                error={errors.lastName?.message}
                {...register('lastName')}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <TextField
                label="Email Address"
                type="email"
                placeholder="john@example.com"
                error={errors.email?.message}
                {...register('email')}
              />
              <TextField
                label="Password"
                type="password"
                placeholder="••••••••"
                error={errors.password?.message}
                {...register('password')}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <TextField
                label="Date of Birth"
                type="date"
                max={new Date().toISOString().split('T')[0]}
                error={errors.dob?.message}
                {...register('dob')}
              />
              <TextField
                label="Phone (Optional)"
                type="tel"
                placeholder="(555) 123-4567"
                {...register('phone')}
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
