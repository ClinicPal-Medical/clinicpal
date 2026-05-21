import prisma from '@/lib/db';
import { NotificationUrgency } from '@prisma/client';

type NotificationInput = {
  externalKey: string;
  title: string;
  body: string;
  urgency: NotificationUrgency;
  actionUrl?: string;
  actionLabel?: string;
};

export async function syncNotifications(
  recipientId: string,
  recipientType: 'PATIENT' | 'STAFF'
) {
  const now = new Date();
  const todayKey = now.toISOString().split('T')[0];
  const toUpsert: NotificationInput[] = [];

  if (recipientType === 'PATIENT') {
    const [upcomingAppts, unpaidInvoices] = await Promise.all([
      prisma.appointment.findMany({
        where: {
          patientId: recipientId,
          status: { in: ['PENDING', 'CONFIRMED'] },
          scheduledAt: { gt: now },
        },
        include: { staff: true },
        orderBy: { scheduledAt: 'asc' },
        take: 5,
      }),
      prisma.invoice.findMany({
        where: { patientId: recipientId, status: 'UNPAID' },
      }),
    ]);

    for (const appt of upcomingAppts) {
      const hoursUntil = (appt.scheduledAt.getTime() - now.getTime()) / 3_600_000;
      const dateStr = appt.scheduledAt.toLocaleDateString('en-US', {
        weekday: 'long', month: 'short', day: 'numeric',
      });
      const timeStr = appt.scheduledAt.toLocaleTimeString('en-US', {
        hour: 'numeric', minute: '2-digit',
      });

      if (hoursUntil <= 24) {
        toUpsert.push({
          externalKey: `appt-24h-${appt.id}`,
          title: hoursUntil <= 2 ? 'Appointment Starting Soon' : 'Appointment Tomorrow',
          body: `You have an appointment with ${appt.staff.name} at ${timeStr} on ${dateStr}.`,
          urgency: 'URGENT',
          actionUrl: '/patient/appointments',
          actionLabel: 'View Details',
        });
      } else if (hoursUntil <= 168) {
        toUpsert.push({
          externalKey: `appt-7d-${appt.id}`,
          title: 'Upcoming Appointment',
          body: `You have an appointment with ${appt.staff.name} at ${timeStr} on ${dateStr}.`,
          urgency: 'WARNING',
          actionUrl: '/patient/appointments',
          actionLabel: 'View Details',
        });
      }
    }

    for (const invoice of unpaidInvoices) {
      toUpsert.push({
        externalKey: `invoice-unpaid-${invoice.id}`,
        title: 'Payment Due',
        body: `You have an outstanding invoice of $${invoice.amount.toFixed(2)}.`,
        urgency: 'WARNING',
        actionUrl: '/patient/appointments',
        actionLabel: 'View Invoice',
      });
    }
  } else {
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

    const [allStock, pendingToday] = await Promise.all([
      prisma.stockItem.findMany(),
      prisma.appointment.count({
        where: {
          scheduledAt: { gte: startOfDay, lte: endOfDay },
          status: 'PENDING',
        },
      }),
    ]);

    for (const item of allStock.filter(i => i.quantity <= i.reorderThreshold)) {
      let urgency: NotificationUrgency;
      if (item.quantity === 0) urgency = 'CRITICAL';
      else if (item.quantity <= Math.floor(item.reorderThreshold / 2)) urgency = 'URGENT';
      else urgency = 'WARNING';

      toUpsert.push({
        externalKey: `stock-${item.id}-${recipientId}-${todayKey}`,
        title: item.quantity === 0 ? `Out of Stock: ${item.name}` : `Low Stock: ${item.name}`,
        body: `${item.quantity} unit${item.quantity === 1 ? '' : 's'} remaining (reorder threshold: ${item.reorderThreshold}).`,
        urgency,
        actionUrl: '/staff/stock',
        actionLabel: 'Manage Stock',
      });
    }

    if (pendingToday > 0) {
      toUpsert.push({
        externalKey: `pending-appts-${recipientId}-${todayKey}`,
        title: `${pendingToday} Pending Appointment${pendingToday > 1 ? 's' : ''} Today`,
        body: `${pendingToday} appointment${pendingToday > 1 ? 's' : ''} ${pendingToday > 1 ? 'are' : 'is'} awaiting confirmation.`,
        urgency: 'WARNING',
        actionUrl: '/staff/appointments',
        actionLabel: 'Review',
      });
    }
  }

  await Promise.all(
    toUpsert.map(n =>
      prisma.notification.upsert({
        where: { externalKey: n.externalKey },
        create: { recipientId, recipientType, ...n },
        update: {
          title: n.title,
          body: n.body,
          urgency: n.urgency,
          actionUrl: n.actionUrl ?? null,
          actionLabel: n.actionLabel ?? null,
        },
      })
    )
  );
}

const URGENCY_ORDER: Record<NotificationUrgency, number> = {
  CRITICAL: 0,
  URGENT: 1,
  WARNING: 2,
  INFO: 3,
};

export async function getNotifications(recipientId: string, recipientType: 'PATIENT' | 'STAFF') {
  await syncNotifications(recipientId, recipientType);

  const rows = await prisma.notification.findMany({
    where: { recipientId, recipientType, dismissedAt: null },
  });

  return rows.sort((a, b) => {
    const diff = URGENCY_ORDER[a.urgency] - URGENCY_ORDER[b.urgency];
    return diff !== 0 ? diff : b.createdAt.getTime() - a.createdAt.getTime();
  });
}
