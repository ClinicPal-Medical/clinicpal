import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db';
import Link from 'next/link';
import { Users, AlertTriangle, Clock, DollarSign, Calendar, ArrowRight, Package } from 'lucide-react';
import * as billingService from '@/modules/billing/service';
import PageHeader from '@/components/PageHeader';
import StatCard from '@/components/StatCard';
import StatusBadge from '@/components/StatusBadge';

export default async function StaffDashboard() {
  const session = await getServerSession(authOptions);
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

  const [todayAppts, pendingAppts, allStock, revenueMetrics] = await Promise.all([
    prisma.appointment.findMany({
      where: { scheduledAt: { gte: startOfToday, lte: endOfToday } },
      include: { patient: true, staff: true },
      orderBy: { scheduledAt: 'asc' },
      take: 5
    }),
    prisma.appointment.count({
      where: { status: 'PENDING' }
    }),
    prisma.stockItem.findMany(),
    billingService.getRevenueMetrics(now.getMonth() + 1, now.getFullYear())
  ]);

  const todayCount = await prisma.appointment.count({
    where: { scheduledAt: { gte: startOfToday, lte: endOfToday } }
  });

  const lowStockTotal = allStock.filter(i => i.quantity <= i.reorderThreshold);
  const lowStockItems = lowStockTotal.slice(0, 5);
  const allLowStock = lowStockTotal.length;

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">
      <PageHeader
        title="Staff Overview"
        subtitle={`Welcome back, ${session?.user?.name ?? ''}. Here's what's happening today.`}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard icon={Calendar} tone="blue" label="Today's Appts" value={todayCount} />
        <StatCard icon={Clock} tone="amber" label="Pending Actions" value={pendingAppts} />
        <StatCard icon={AlertTriangle} tone="red" label="Low Stock" value={allLowStock} />
        <StatCard icon={DollarSign} tone="emerald" label="MTD Revenue" value={`$${revenueMetrics.mtdRevenue.toFixed(2)}`} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Today's Queue */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Users size={20} className="text-blue-500" /> Today's Queue
            </h2>
            <Link href="/staff/appointments" className="text-sm font-bold text-blue-600 hover:text-blue-800 flex items-center transition-colors">
              View all <ArrowRight size={16} className="ml-1" />
            </Link>
          </div>
          <div className="p-6 flex-1">
            {todayAppts.length > 0 ? (
              <div className="space-y-4">
                {todayAppts.map(appt => (
                   <div key={appt.id} className="flex items-center justify-between p-4 rounded-xl border border-slate-100 hover:border-blue-100 transition-colors">
                     <div>
                       <p className="font-bold text-slate-800">{appt.patient.firstName} {appt.patient.lastName}</p>
                       <p className="text-sm text-slate-500 font-medium">
                         {appt.scheduledAt.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - {appt.reason}
                       </p>
                     </div>
                     <StatusBadge status={appt.status} />
                   </div>
                ))}
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 font-medium pb-8 pt-4">No appointments scheduled today.</div>
            )}
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden flex flex-col">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Package size={20} className="text-amber-500" /> Restock Alerts
            </h2>
            <Link href="/staff/stock" className="text-sm font-bold text-amber-600 hover:text-amber-800 flex items-center transition-colors">
              View all <ArrowRight size={16} className="ml-1" />
            </Link>
          </div>
          <div className="p-6 flex-1">
             {lowStockItems.length > 0 ? (
              <div className="space-y-4">
                {lowStockItems.map(item => (
                   <div key={item.id} className="flex items-center justify-between p-4 rounded-xl border border-red-100 bg-red-50/50">
                     <div>
                       <p className="font-bold text-slate-800">{item.name}</p>
                       <p className="text-sm text-slate-500 font-medium">Category: {item.category}</p>
                     </div>
                     <div className="text-right">
                       <p className="text-xl font-black text-red-600">{item.quantity} left</p>
                       <p className="text-xs font-bold text-red-400 uppercase tracking-widest mt-1">Below {item.reorderThreshold}</p>
                     </div>
                   </div>
                ))}
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 font-medium pb-8 pt-4">All stock levels are optimal.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
