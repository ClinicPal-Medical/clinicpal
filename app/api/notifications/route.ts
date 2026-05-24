import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { getNotifications } from '@/lib/notifications';

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const recipientType = session.user.role === 'PATIENT' ? 'PATIENT' : 'STAFF';

  try {
    const notifications = await getNotifications(session.user.id, recipientType);
    return NextResponse.json(notifications);
  } catch {
    return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 });
  }
}
