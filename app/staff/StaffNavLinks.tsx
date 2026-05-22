import Link from 'next/link';
import {
  LayoutDashboard,
  Calendar,
  Users,
  Package,
  DollarSign,
  LogOut,
  type LucideIcon,
} from 'lucide-react';

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  adminOnly?: boolean;
};

const ITEMS: NavItem[] = [
  { href: '/staff/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/staff/appointments', label: 'Appointments', icon: Calendar },
  { href: '/staff/patients', label: 'Patients', icon: Users },
  { href: '/staff/stock', label: 'Stock Inventory', icon: Package },
  { href: '/staff/revenue', label: 'Revenue', icon: DollarSign, adminOnly: true },
];

const LINK_CLASSES =
  'flex items-center space-x-3 px-4 py-3 text-slate-300 hover:bg-slate-800 hover:text-white rounded-xl transition-all font-medium';

export default function StaffNavLinks({ isAdmin }: { isAdmin: boolean }) {
  return (
    <>
      <nav className="flex-1 px-4 space-y-2 mt-4">
        {ITEMS.filter((item) => !item.adminOnly || isAdmin).map((item) => {
          const Icon = item.icon;
          return (
            <Link key={item.href} href={item.href} className={LINK_CLASSES}>
              <Icon size={20} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-800">
        <Link
          href="/api/auth/signout"
          className="flex items-center space-x-3 px-4 py-3 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-xl transition-all font-medium"
        >
          <LogOut size={20} />
          <span>Sign Out</span>
        </Link>
      </div>
    </>
  );
}
