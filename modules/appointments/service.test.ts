import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as appointmentService from './service';
import prisma from '@/lib/db';

// Mock DB
vi.mock('@/lib/db', () => ({
  default: {
    appointment: {
      findMany: vi.fn(),
      create: vi.fn(),
      findUnique: vi.fn(),
      update: vi.fn(),
    }
  }
}));

describe('Appointments Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should find available slots filtering out booked ones', async () => {
    const today = new Date().toISOString().split('T')[0]; // "2026-03-24"
    const startOfDay = new Date(`${today}T09:00:00`);
    
    // One appointment already booked at 9:00 AM
    const bookedTime = new Date(startOfDay.getTime());
    
    // Let's pretend it's currently 8:00 AM for the test so slots don't get filtered out by "Date.now()" natively.
    vi.useFakeTimers();
    vi.setSystemTime(new Date(`${today}T08:00:00`));

    (prisma.appointment.findMany as any).mockResolvedValue([
      { scheduledAt: bookedTime, status: 'CONFIRMED' }
    ]);

    const slots = await appointmentService.getAvailableSlots('staff-123', today);

    expect(prisma.appointment.findMany).toHaveBeenCalled();
    expect(slots.length).toBeGreaterThan(0);
    // 9:00 AM should be removed, so the first available should be 9:30 AM
    const firstSlotDate = new Date(slots[0]);
    expect(firstSlotDate.getHours()).toBe(9);
    expect(firstSlotDate.getMinutes()).toBe(30);

    vi.useRealTimers();
  });

  it('should create an appointment successfully', async () => {
    const fakeAppt = { id: 'appt-1', patientId: 'p-1', staffId: 's-1' };
    (prisma.appointment.create as any).mockResolvedValue(fakeAppt);
    
    const result = await appointmentService.bookAppointment('p-1', 's-1', '2026-03-24T10:00:00Z', 'Checkup');
    
    expect(prisma.appointment.create).toHaveBeenCalled();
    expect(result).toEqual(fakeAppt);
  });

  it('should cancel an appointment if > 2h away', async () => {
    const futureDate = new Date(Date.now() + 5 * 60 * 60 * 1000); // 5 hours away
    const fakeAppt = { id: 'appt-1', patientId: 'p-1', scheduledAt: futureDate };
    
    (prisma.appointment.findUnique as any).mockResolvedValue(fakeAppt);
    (prisma.appointment.update as any).mockResolvedValue({ ...fakeAppt, status: 'CANCELLED' });

    const result = await appointmentService.cancelAppointment('appt-1', 'p-1');
    expect(prisma.appointment.update).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: 'appt-1' },
      data: { status: 'CANCELLED' }
    }));
    expect(result.status).toBe('CANCELLED');
  });

  it('should throw an error if cancelling within 2 hours', async () => {
    const futureDate = new Date(Date.now() + 1 * 60 * 60 * 1000); // 1 hour away
    const fakeAppt = { id: 'appt-1', patientId: 'p-1', scheduledAt: futureDate };
    
    (prisma.appointment.findUnique as any).mockResolvedValue(fakeAppt);

    await expect(appointmentService.cancelAppointment('appt-1', 'p-1'))
      .rejects.toThrow('Cannot cancel within 2 hours of the scheduled time');
      
    expect(prisma.appointment.update).not.toHaveBeenCalled();
  });
});
