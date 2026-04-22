import prisma from "@/lib/db"

/**
 * Appointments Service
 * 
 * Scalability note: When the staff dashboard is built, this module will manage 
 * doctor schedules, shift overlaps, and allow receptionists to force-book 
 * or cancel appointments on behalf of patients.
 */

export async function getPatientAppointments(patientId: string) {
  return prisma.appointment.findMany({
    where: { patientId },
    include: { staff: true },
    orderBy: { scheduledAt: 'desc' }
  });
}

export async function getAvailableSlots(staffId: string, date: string) {
  const startOfDay = new Date(`${date}T09:00:00`);
  const endOfDay = new Date(`${date}T21:00:00`);
  
  const existingAppts = await prisma.appointment.findMany({
    where: {
      staffId,
      scheduledAt: { gte: startOfDay, lt: endOfDay },
      status: { not: 'CANCELLED' }
    }
  });

  const bookedTimes = existingAppts.map(a => a.scheduledAt.getTime());
  
  const slots: string[] = [];
  let currentSlot = new Date(startOfDay);
  
  while (currentSlot < endOfDay) {
    if (!bookedTimes.includes(currentSlot.getTime())) {
      if (currentSlot.getTime() > Date.now()) {
        slots.push(currentSlot.toISOString());
      }
    }
    currentSlot = new Date(currentSlot.getTime() + 30 * 60000);
  }
  
  return slots;
}

export async function bookAppointment(patientId: string, staffId: string, scheduledAtStr: string, reason: string) {
  const scheduledAt = new Date(scheduledAtStr);
  
  const appointment = await prisma.appointment.create({
    data: {
      patientId,
      staffId,
      scheduledAt,
      reason,
      status: 'PENDING'
    },
    include: { staff: true, patient: true }
  });

  return appointment;
}

export async function cancelAppointment(appointmentId: string, patientId: string) {
  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    include: { staff: true, patient: true }
  });

  if (!appointment || appointment.patientId !== patientId) {
    throw new Error('Appointment not found or unauthorized');
  }

  const hoursUntil = (appointment.scheduledAt.getTime() - Date.now()) / (1000 * 60 * 60);
  if (hoursUntil < 2) {
    throw new Error('Cannot cancel within 2 hours of the scheduled time');
  }

  const updated = await prisma.appointment.update({
    where: { id: appointmentId },
    data: { status: 'CANCELLED' }
  });

  return updated;
}
