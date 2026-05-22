import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import MobileNav from "./MobileNav";
import StaffNavLinks from "./StaffNavLinks";

export default async function StaffLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role === "PATIENT") {
    redirect("/login");
  }

  const role = session.user.role;
  const isAdmin = role === "ADMIN";

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <MobileNav role={role} isAdmin={isAdmin} />

      {/* Sidebar (desktop) */}
      <div className="w-64 bg-slate-900 text-white flex-col hidden md:flex fixed h-full">
        <div className="p-6">
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center">
            Clinic<span className="text-blue-500">Pal</span> Staff
          </h1>
          <p className="text-xs text-slate-400 font-medium mt-1 uppercase tracking-wider">
            {role}
          </p>
        </div>

        <StaffNavLinks isAdmin={isAdmin} />
      </div>

      {/* Main Content */}
      <div className="flex-1 md:ml-64 pt-16 md:pt-0 overflow-y-auto">
        <div className="max-w-6xl mx-auto p-4 md:p-8 pb-16">{children}</div>
      </div>
    </div>
  );
}
