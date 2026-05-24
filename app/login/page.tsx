"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { signIn, getSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Button from "@/components/Button";
import TextField from "@/components/TextField";

const loginSchema = z.object({
  email: z.string().min(1, "Email is required").email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

type FormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const {
    register,
    handleSubmit,
    formState: { isSubmitting, errors },
  } = useForm<FormValues>({ resolver: zodResolver(loginSchema) });

  const onSubmit = async ({ email, password }: FormValues) => {
    setError("");
    const res = await signIn("credentials", { redirect: false, email, password });

    if (res?.error) {
      setError(res.error);
      return;
    }
    const session = await getSession();
    router.push(
      session?.user?.role && session.user.role !== "PATIENT"
        ? "/staff/dashboard"
        : "/patient/dashboard",
    );
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

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {error && (
              <div className="p-4 bg-red-50 text-red-600 border border-red-100 rounded-xl text-sm font-semibold text-center">
                {error}
              </div>
            )}

            <TextField
              label="Email Address"
              type="email"
              placeholder="john.doe@example.com"
              error={errors.email?.message}
              {...register("email")}
            />

            <TextField
              label="Password"
              type="password"
              placeholder="••••••••"
              error={errors.password?.message}
              {...register("password")}
            />

            <Button
              type="submit"
              size="lg"
              fullWidth
              loading={isSubmitting}
              loadingText="Signing in..."
            >
              Sign In
            </Button>
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
