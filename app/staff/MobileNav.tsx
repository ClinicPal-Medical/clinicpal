"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import StaffNavLinks from "./StaffNavLinks";

type Props = {
  role: string;
  isAdmin: boolean;
};

export default function MobileNav({ role, isAdmin }: Props) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <>
      <header className="md:hidden fixed top-0 inset-x-0 z-30 h-14 bg-slate-900 text-white flex items-center justify-between px-4 shadow">
        <h1 className="text-lg font-black tracking-tight flex items-center">
          Clinic<span className="text-blue-500">Pal</span>
          <span className="ml-2 text-[10px] text-slate-400 uppercase tracking-wider font-medium">
            {role}
          </span>
        </h1>
        <button
          type="button"
          aria-label="Open navigation"
          aria-expanded={open}
          aria-controls="staff-mobile-drawer"
          onClick={() => setOpen(true)}
          className="p-2 -mr-2 rounded-lg hover:bg-slate-800 transition-colors"
        >
          <Menu size={22} />
        </button>
      </header>

      <div
        className={`md:hidden fixed inset-0 z-40 bg-black/50 transition-opacity duration-200 ${
          open ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setOpen(false)}
        aria-hidden="true"
      />

      <aside
        id="staff-mobile-drawer"
        role="dialog"
        aria-modal="true"
        aria-label="Staff navigation"
        aria-hidden={!open}
        className={`md:hidden fixed top-0 left-0 z-50 h-full w-64 bg-slate-900 text-white flex flex-col transform transition-transform duration-200 ease-out ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="p-6 flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight flex items-center">
              Clinic<span className="text-blue-500">Pal</span> Staff
            </h1>
            <p className="text-xs text-slate-400 font-medium mt-1 uppercase tracking-wider">
              {role}
            </p>
          </div>
          <button
            type="button"
            aria-label="Close navigation"
            onClick={() => setOpen(false)}
            className="p-2 -mr-2 -mt-2 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X size={22} />
          </button>
        </div>

        <StaffNavLinks isAdmin={isAdmin} />
      </aside>
    </>
  );
}
