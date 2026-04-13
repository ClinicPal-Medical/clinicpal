'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function SignupPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    dob: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Failed to register');
        setLoading(false);
      } else {
        setSuccess(true);
        setTimeout(() => {
          router.push('/login');
        }, 2000);
      }
    } catch (err: any) {
      setError('An unexpected error occurred.');
      setLoading(false);
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

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-4 bg-red-50 text-red-600 border border-red-100 rounded-xl text-sm font-semibold text-center">
                {error}
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">First Name</label>
                <input
                  type="text" required
                  value={formData.firstName}
                  onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                  className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-xl focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none transition-all font-medium text-slate-800"
                  placeholder="John"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Last Name</label>
                <input
                  type="text" required
                  value={formData.lastName}
                  onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                  className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-xl focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none transition-all font-medium text-slate-800"
                  placeholder="Doe"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Email Address</label>
                <input
                  type="email" required
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-xl focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none transition-all font-medium text-slate-800"
                  placeholder="john@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Password</label>
                <input
                  type="password" required minLength={8}
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-xl focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none transition-all font-medium text-slate-800"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Date of Birth</label>
                <input
                  type="date" required max={new Date().toISOString().split('T')[0]}
                  value={formData.dob}
                  onChange={(e) => setFormData({...formData, dob: e.target.value})}
                  className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-xl focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none transition-all font-medium text-slate-800"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Phone (Optional)</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-xl focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none transition-all font-medium text-slate-800"
                  placeholder="(555) 123-4567"
                />
              </div>
            </div>
            
            <button
              type="submit" disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold py-4 rounded-xl transition-all shadow-md shadow-blue-200 active:scale-95 text-lg mt-4"
            >
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
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
