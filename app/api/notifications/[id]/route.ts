import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/db';

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const { action } = await request.json();

  if (action !== 'read' && action !== 'dismiss') {
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  }

  const notification = await prisma.notification.findUnique({ where: { id } });

  if (!notification || notification.recipientId !== session.user.id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const updated = await prisma.notification.update({
    where: { id },
    data: action === 'dismiss' ? { dismissedAt: new Date() } : { readAt: new Date() },
  });

  return NextResponse.json(updated);
}
