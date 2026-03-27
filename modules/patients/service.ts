import prisma from "@/lib/db"

/**
 * Patient Service
 * 
 * Scalability note: Once the staff dashboard is built, this module will be expanded 
 * to allow staff to edit patient medical records, notes, and view full patient histories.
 */

export async function getPatientById(patientId: string) {
  return prisma.patient.findUnique({
    where: { id: patientId },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      dob: true,
      notes: true,
    }
  });
}

export async function updatePatientProfile(
  patientId: string, 
  data: { firstName?: string, lastName?: string, phone?: string, email?: string }
) {
  return prisma.patient.update({
    where: { id: patientId },
    data,
  });
}

export async function createPatientProfile(data: any) {
    return prisma.patient.create({ data });
}
