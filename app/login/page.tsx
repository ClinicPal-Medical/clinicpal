"use client";

import { useState } from "react";
import { signIn, getSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await signIn("credentials", {
      redirect: false,
      email,
      password,
    });

    if (res?.error) {
      setError(res.error);
      setLoading(false);
    } else {
      const session = await getSession();
      if (session?.user?.role && session.user.role !== "PATIENT") {
        router.push("/staff/dashboard");
      } else {
        router.push("/patient/dashboard");
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-bottom-8 duration-700">
        <div className="p-10">
          <div className="flex justify-center mb-8">
            <div className="h-14 w-14 bg-blue-600 rounded-2xl flex items-center justify-center text-white font-black text-3xl shadow-lg shadow-blue-200">
              +
            </div>
          </div>
          <h2 className="text-3xl font-extrabold text-slate-900 text-center tracking-tight mb-2">
            Welcome Back
          </h2>
          <p className="text-center text-slate-500 font-medium mb-8">
            Sign in to manage your appointments.
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-4 bg-red-50 text-red-600 border border-red-100 rounded-xl text-sm font-semibold text-center">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-xl focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none transition-all font-medium text-slate-800"
                placeholder="john.doe@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-4 bg-slate-50 border-2 border-slate-100 rounded-xl focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none transition-all font-medium text-slate-800"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold py-4 rounded-xl transition-all shadow-md shadow-blue-200 active:scale-95 text-lg"
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          <div className="mt-8 text-center bg-slate-50 p-4 rounded-xl">
            <p className="text-xs text-slate-500 font-medium uppercase tracking-wider mb-2">
              Demo Credentials
            </p>
            <p className="text-sm font-semibold text-slate-700">
              john.doe@example.com <br /> jane.smith@example.com
            </p>
            <p className="text-sm font-semibold text-slate-700">
              nurse@clinicpal.com <br /> doctor@clinicpal.com
            </p>
            <p className="text-sm text-slate-500 mt-1">
              <span className="font-mono bg-slate-200 px-1 py-0.5 rounded text-slate-700">
                password123
              </span>
            </p>
          </div>

          <div className="mt-6 text-center">
            <p className="text-sm font-medium text-slate-500">
              Don&apos;t have an account?{" "}
              <Link
                href="/signup"
                className="text-blue-600 font-bold hover:underline"
              >
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
