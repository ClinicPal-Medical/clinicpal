import prisma from "@/lib/db";

// ─── Shared Prisma includes ───────────────────────────────────────────────────

const encounterInclude = {
  prescriptions: {
    include: { items: true },
    orderBy: { createdAt: "desc" as const },
  },
  certificates: { orderBy: { createdAt: "desc" as const } },
  referrals: { orderBy: { createdAt: "desc" as const } },
} as const;

const patientHistoryInclude = {
  encounters: {
    where: { appointment: { status: "COMPLETED" as const } },
    include: {
      prescriptions: {
        include: { items: true },
        orderBy: { createdAt: "desc" as const },
      },
      certificates: { orderBy: { createdAt: "desc" as const } },
      referrals: { orderBy: { createdAt: "desc" as const } },
    },
    orderBy: { createdAt: "desc" as const },
  },
} as const;

// ─── Main page data loader ────────────────────────────────────────────────────

export async function getEncounterPage(appointmentId: string, doctorId: string) {
  // 1. Validate appointment
  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    include: { patient: true, staff: true },
  });

  if (!appointment) return { error: "NOT_FOUND" as const };
  if (appointment.status !== "CONFIRMED") return { error: "NOT_CONFIRMED" as const };

  // 2. Get or create encounter
  const encounter = await prisma.encounter.upsert({
    where: { appointmentId },
    update: {},
    create: {
      appointmentId,
      patientId: appointment.patientId,
      doctorId,
    },
    include: encounterInclude,
  });

  // 3. Patient history
  const patientWithHistory = await prisma.patient.findUnique({
    where: { id: appointment.patientId },
    include: patientHistoryInclude,
  });

  // 4. Stock items for INTERNAL prescription autocomplete
  const stockItems = await prisma.stockItem.findMany({
    select: { id: true, name: true, quantity: true },
    orderBy: { name: "asc" },
  });

  // 5. Next patient in today's queue
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date(todayStart);
  todayEnd.setDate(todayEnd.getDate() + 1);

  const nextAppt = await prisma.appointment.findFirst({
    where: {
      staffId: appointment.staffId,
      status: "CONFIRMED",
      scheduledAt: {
        gt: appointment.scheduledAt,
        gte: todayStart,
        lt: todayEnd,
      },
    },
    include: { patient: true },
    orderBy: { scheduledAt: "asc" },
  });

  return {
    encounter,
    appointment,
    patient: patientWithHistory!,
    stockItems,
    nextPatient: nextAppt
      ? {
          patientName: `${nextAppt.patient.firstName} ${nextAppt.patient.lastName}`,
          scheduledAt: nextAppt.scheduledAt,
        }
      : null,
    doctorName: appointment.staff.name,
  };
}

// ─── Encounter field updates ───────────────────────────────────────────────────

export async function updateEncounterFields(
  appointmentId: string,
  fields: {
    chiefComplaint?: string;
    examination?: string;
    diagnosis?: string;
    plan?: string;
  }
) {
  const appt = await prisma.appointment.findUnique({ where: { id: appointmentId } });
  if (!appt) return { error: "NOT_FOUND" as const };
  if (appt.status === "COMPLETED") return { error: "LOCKED" as const };

  const encounter = await prisma.encounter.update({
    where: { appointmentId },
    data: fields,
    include: encounterInclude,
  });
  return { encounter };
}

// ─── Prescriptions ────────────────────────────────────────────────────────────

export async function createPrescription(
  appointmentId: string,
  doctorId: string,
  data: {
    type: "INTERNAL" | "EXTERNAL";
    notes?: string;
    items: {
      medicationName: string;
      dosage: string;
      frequency: string;
      durationDays: number;
      quantity: number;
      instructions?: string;
    }[];
  }
) {
  const encounter = await prisma.encounter.findUnique({ where: { appointmentId } });
  if (!encounter) return { error: "NOT_FOUND" as const };

  // Validate INTERNAL medication names against stock
  if (data.type === "INTERNAL") {
    const names = data.items.map((i) => i.medicationName);
    const found = await prisma.stockItem.findMany({
      where: { name: { in: names } },
      select: { name: true },
    });
    const foundNames = found.map((s) => s.name);
    const unrecognised = names.filter((n) => !foundNames.includes(n));
    if (unrecognised.length > 0) {
      return { error: "UNRECOGNISED_ITEMS" as const, unrecognised };
    }
  }

  const prescription = await prisma.prescription.create({
    data: {
      encounterId: encounter.id,
      patientId: encounter.patientId,
      doctorId,
      type: data.type,
      notes: data.notes,
      items: { create: data.items },
    },
    include: { items: true },
  });
  return { prescription };
}

export async function issuePrescription(
  appointmentId: string,
  prescriptionId: string,
  doctorId: string
) {
  const encounter = await prisma.encounter.findUnique({ where: { appointmentId } });
  if (!encounter) return { error: "NOT_FOUND" as const };

  const prescription = await prisma.prescription.findFirst({
    where: { id: prescriptionId, encounterId: encounter.id },
    include: { items: true },
  });
  if (!prescription) return { error: "NOT_FOUND" as const };
  if (prescription.status === "ISSUED") return { error: "ALREADY_ISSUED" as const };

  if (prescription.type === "INTERNAL") {
    const names = prescription.items.map((i) => i.medicationName);
    const stockItems = await prisma.stockItem.findMany({
      where: { name: { in: names } },
    });

    const outOfStockItems: string[] = [];
    for (const item of prescription.items) {
      const stock = stockItems.find((s) => s.name === item.medicationName);
      if (!stock || stock.quantity < item.quantity) {
        outOfStockItems.push(item.medicationName);
      }
    }
    if (outOfStockItems.length > 0) {
      return { error: "OUT_OF_STOCK" as const, outOfStockItems };
    }

    // Atomic: deduct stock + create transactions + mark issued
    await prisma.$transaction(async (tx) => {
      for (const item of prescription.items) {
        const stock = stockItems.find((s) => s.name === item.medicationName)!;
        await tx.stockItem.update({
          where: { id: stock.id },
          data: { quantity: { decrement: item.quantity } },
        });
        await tx.stockTransaction.create({
          data: {
            itemId: stock.id,
            staffId: doctorId,
            type: "USED",
            quantityDelta: -item.quantity,
            notes: `Issued via prescription ${prescriptionId}`,
          },
        });
      }
      await tx.prescription.update({
        where: { id: prescriptionId },
        data: { status: "ISSUED", issuedAt: new Date() },
      });
    });
  } else {
    await prisma.prescription.update({
      where: { id: prescriptionId },
      data: { status: "ISSUED", issuedAt: new Date() },
    });
  }

  return {
    prescription: await prisma.prescription.findUnique({
      where: { id: prescriptionId },
      include: { items: true },
    }),
  };
}

export async function deletePrescription(appointmentId: string, prescriptionId: string) {
  const encounter = await prisma.encounter.findUnique({ where: { appointmentId } });
  if (!encounter) return { error: "NOT_FOUND" as const };

  const prescription = await prisma.prescription.findFirst({
    where: { id: prescriptionId, encounterId: encounter.id },
  });
  if (!prescription) return { error: "NOT_FOUND" as const };
  if (prescription.status === "ISSUED") return { error: "ALREADY_ISSUED" as const };

  await prisma.prescription.delete({ where: { id: prescriptionId } });
  return { ok: true };
}

// ─── Medical Certificates ─────────────────────────────────────────────────────

export async function createCertificate(
  appointmentId: string,
  doctorId: string,
  data: {
    diagnosis: string;
    fitForWork: boolean;
    fromDate: Date;
    toDate: Date;
    notes?: string;
  }
) {
  const encounter = await prisma.encounter.findUnique({ where: { appointmentId } });
  if (!encounter) return { error: "NOT_FOUND" as const };

  const certificate = await prisma.medicalCertificate.create({
    data: {
      encounterId: encounter.id,
      patientId: encounter.patientId,
      doctorId,
      ...data,
    },
  });
  return { certificate };
}

export async function issueCertificate(appointmentId: string, certificateId: string) {
  const encounter = await prisma.encounter.findUnique({ where: { appointmentId } });
  if (!encounter) return { error: "NOT_FOUND" as const };

  const cert = await prisma.medicalCertificate.findFirst({
    where: { id: certificateId, encounterId: encounter.id },
  });
  if (!cert) return { error: "NOT_FOUND" as const };
  if (cert.issuedAt) return { error: "ALREADY_ISSUED" as const };

  const updated = await prisma.medicalCertificate.update({
    where: { id: certificateId },
    data: { issuedAt: new Date() },
  });
  return { certificate: updated };
}

export async function deleteCertificate(appointmentId: string, certificateId: string) {
  const encounter = await prisma.encounter.findUnique({ where: { appointmentId } });
  if (!encounter) return { error: "NOT_FOUND" as const };

  const cert = await prisma.medicalCertificate.findFirst({
    where: { id: certificateId, encounterId: encounter.id },
  });
  if (!cert) return { error: "NOT_FOUND" as const };
  if (cert.issuedAt) return { error: "ALREADY_ISSUED" as const };

  await prisma.medicalCertificate.delete({ where: { id: certificateId } });
  return { ok: true };
}

// ─── Referrals ────────────────────────────────────────────────────────────────

export async function createReferral(
  appointmentId: string,
  doctorId: string,
  data: {
    referredTo: string;
    reason: string;
    urgency: "ROUTINE" | "URGENT" | "EMERGENCY";
    notes?: string;
  }
) {
  const encounter = await prisma.encounter.findUnique({ where: { appointmentId } });
  if (!encounter) return { error: "NOT_FOUND" as const };

  const referral = await prisma.referral.create({
    data: {
      encounterId: encounter.id,
      patientId: encounter.patientId,
      doctorId,
      ...data,
    },
  });
  return { referral };
}

export async function issueReferral(appointmentId: string, referralId: string) {
  const encounter = await prisma.encounter.findUnique({ where: { appointmentId } });
  if (!encounter) return { error: "NOT_FOUND" as const };

  const referral = await prisma.referral.findFirst({
    where: { id: referralId, encounterId: encounter.id },
  });
  if (!referral) return { error: "NOT_FOUND" as const };
  if (referral.issuedAt) return { error: "ALREADY_ISSUED" as const };

  const updated = await prisma.referral.update({
    where: { id: referralId },
    data: { issuedAt: new Date() },
  });
  return { referral: updated };
}

export async function deleteReferral(appointmentId: string, referralId: string) {
  const encounter = await prisma.encounter.findUnique({ where: { appointmentId } });
  if (!encounter) return { error: "NOT_FOUND" as const };

  const referral = await prisma.referral.findFirst({
    where: { id: referralId, encounterId: encounter.id },
  });
  if (!referral) return { error: "NOT_FOUND" as const };
  if (referral.issuedAt) return { error: "ALREADY_ISSUED" as const };

  await prisma.referral.delete({ where: { id: referralId } });
  return { ok: true };
}

// ─── Complete encounter ───────────────────────────────────────────────────────

export async function completeEncounter(appointmentId: string) {
  const encounter = await prisma.encounter.findUnique({
    where: { appointmentId },
    include: { appointment: true },
  });
  if (!encounter) return { error: "NOT_FOUND" as const };
  if (!encounter.chiefComplaint?.trim() || !encounter.diagnosis?.trim()) {
    return { error: "MISSING_FIELDS" as const };
  }

  await prisma.appointment.update({
    where: { id: appointmentId },
    data: { status: "COMPLETED" },
  });

  // Find next patient in today's queue
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date(todayStart);
  todayEnd.setDate(todayEnd.getDate() + 1);

  const nextAppt = await prisma.appointment.findFirst({
    where: {
      staffId: encounter.appointment.staffId,
      status: "CONFIRMED",
      scheduledAt: {
        gt: encounter.appointment.scheduledAt,
        gte: todayStart,
        lt: todayEnd,
      },
    },
    include: { patient: true },
    orderBy: { scheduledAt: "asc" },
  });

  return {
    nextPatient: nextAppt
      ? {
          patientName: `${nextAppt.patient.firstName} ${nextAppt.patient.lastName}`,
          scheduledAt: nextAppt.scheduledAt,
        }
      : null,
  };
}

// ─── PDF data fetchers ────────────────────────────────────────────────────────

export async function getPrescriptionForPrint(id: string) {
  return prisma.prescription.findUnique({
    where: { id },
    include: {
      items: true,
      doctor: true,
      patient: true,
    },
  });
}

export async function getCertificateForPrint(id: string) {
  return prisma.medicalCertificate.findUnique({
    where: { id },
    include: { doctor: true, patient: true },
  });
}

export async function getReferralForPrint(id: string) {
  return prisma.referral.findUnique({
    where: { id },
    include: { doctor: true, patient: true },
  });
}
