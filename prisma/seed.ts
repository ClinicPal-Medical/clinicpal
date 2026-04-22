import { PrismaClient, Role, InvoiceStatus, PrescriptionType, PrescriptionStatus, Urgency } from '@prisma/client'
import bcrypt from 'bcrypt'

const prisma = new PrismaClient({})

async function main() {
  // Delete encounter-related models first (additive teardown)
  await prisma.referral.deleteMany()
  await prisma.medicalCertificate.deleteMany()
  await prisma.prescription.deleteMany() // cascades PrescriptionItem
  await prisma.encounter.deleteMany()
  // Existing teardown
  await prisma.stockTransaction.deleteMany()
  await prisma.stockItem.deleteMany()
  await prisma.invoice.deleteMany()
  await prisma.appointment.deleteMany()
  await prisma.patient.deleteMany()
  await prisma.staff.deleteMany()

  const passwordHash = await bcrypt.hash('password123', 10)

  // 1 Staff per role
  await prisma.staff.create({
    data: {
      name: 'Sarah Connor',
      role: Role.RECEPTIONIST,
      email: 'receptionist@clinicpal.com',
      password: passwordHash,
      active: true,
    },
  })

  await prisma.staff.create({
    data: {
      name: 'Nurse Joy',
      role: Role.NURSE,
      email: 'nurse@clinicpal.com',
      password: passwordHash,
      active: true,
    },
  })

  const drSmith = await prisma.staff.create({
    data: {
      name: 'Dr. Alice Smith',
      role: Role.DOCTOR,
      email: 'doctor@clinicpal.com',
      password: passwordHash,
      specialisation: 'General Practice',
      active: true,
    },
  })

  await prisma.staff.create({
    data: {
      name: 'Admin Admin',
      role: Role.ADMIN,
      email: 'admin@clinicpal.com',
      password: passwordHash,
      active: true,
    },
  })

  // 2 Patients
  const john = await prisma.patient.create({
    data: {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      password: passwordHash,
      phone: '+1234567890',
      dob: new Date('1980-01-01'),
      notes: 'No allergies.',
    },
  })

  const jane = await prisma.patient.create({
    data: {
      firstName: 'Jane',
      lastName: 'Smith',
      email: 'jane.smith@example.com',
      password: passwordHash,
      phone: '+0987654321',
      dob: new Date('1992-05-15'),
    },
  })

  // 20 Stock Items
  const categories = ['Medications', 'Consumables', 'Equipment', 'PPE']
  for (let i = 1; i <= 20; i++) {
    await prisma.stockItem.create({
      data: {
        name: `Stock Item ${i}`,
        category: categories[i % 4],
        quantity: Math.floor(Math.random() * 100) + 10,
        reorderThreshold: 20,
        unitCost: Math.random() * 50 + 5,
        supplier: 'MedSupply Co',
      }
    })
  }

  // 10 Invoices
  for (let i = 1; i <= 10; i++) {
    const isPaid = i % 2 === 0
    await prisma.invoice.create({
      data: {
        patientId: i % 2 === 0 ? john.id : jane.id,
        amount: Math.floor(Math.random() * 200) + 50,
        status: isPaid ? InvoiceStatus.PAID : InvoiceStatus.UNPAID,
        issuedAt: new Date(Date.now() - Math.random() * 1000 * 60 * 60 * 24 * 30),
        paidAt: isPaid ? new Date() : null,
      }
    })
  }

  // ─── Seed: 3 completed encounters for encounter history panel ──────────────

  const pastDates = [
    new Date('2026-01-15T10:00:00'),
    new Date('2026-02-20T14:00:00'),
    new Date('2026-03-10T09:00:00'),
  ]

  const encounterData = [
    {
      reason: 'Annual check-up and fever',
      chiefComplaint: 'Patient presents with fever 38.5°C for 3 days, sore throat, and fatigue.',
      examination: 'Throat erythematous with white patches. Cervical lymphadenopathy. Temperature 38.5°C. HR 92 bpm.',
      diagnosis: 'Bacterial tonsillitis — possible streptococcal infection',
      plan: 'Antibiotics for 7 days. Rest and adequate hydration. Follow up in 48–72 h if no improvement.',
      prescription: {
        type: PrescriptionType.EXTERNAL,
        notes: 'Complete full course.',
        items: [
          { medicationName: 'Amoxicillin 500mg', dosage: '500mg', frequency: 'Three times daily', durationDays: 7, quantity: 21, instructions: 'Take with food' },
          { medicationName: 'Paracetamol 500mg', dosage: '500mg', frequency: 'Every 4–6 hours as needed', durationDays: 3, quantity: 12, instructions: 'Max 8 tablets/day' },
        ],
      },
      cert: { diagnosis: 'Bacterial tonsillitis', fitForWork: false, offsetDays: 2, notes: 'Bed rest required.' },
      referral: { referredTo: 'ENT Specialist — City Hospital', reason: 'Recurrent tonsillitis — consider tonsillectomy evaluation', urgency: Urgency.ROUTINE, notes: 'Third episode this year.' },
    },
    {
      reason: 'Persistent back pain',
      chiefComplaint: 'Lower back pain radiating to left leg for 2 weeks. Worsens with sitting.',
      examination: 'Reduced lumbar flexion. Positive straight leg raise on left at 45°. Neurologically intact.',
      diagnosis: 'L4/L5 disc herniation with left-sided sciatica',
      plan: 'NSAIDs, physiotherapy referral, activity modification. MRI lumbar spine ordered.',
      prescription: {
        type: PrescriptionType.EXTERNAL,
        notes: 'Take ibuprofen with food.',
        items: [
          { medicationName: 'Ibuprofen 400mg', dosage: '400mg', frequency: 'Three times daily with food', durationDays: 14, quantity: 42, instructions: 'Take with food and water' },
          { medicationName: 'Diazepam 5mg', dosage: '5mg', frequency: 'Once nightly', durationDays: 7, quantity: 7, instructions: 'For muscle spasm — use short term only' },
        ],
      },
      cert: { diagnosis: 'L4/L5 disc herniation with sciatica', fitForWork: false, offsetDays: 7, notes: 'Avoid heavy lifting and prolonged sitting.' },
      referral: { referredTo: 'Physiotherapy Department — General Hospital', reason: 'Lumbar strengthening and pain management programme', urgency: Urgency.ROUTINE, notes: 'MRI results to follow.' },
    },
    {
      reason: 'Blood pressure check and medication review',
      chiefComplaint: 'Routine review of hypertension management. Reports occasional headaches.',
      examination: 'BP 148/94 mmHg (right arm). HR 78 bpm regular. No signs of end-organ damage.',
      diagnosis: 'Stage 1 hypertension — suboptimally controlled',
      plan: 'Uptitrate amlodipine to 10mg. Dietary sodium restriction counselled. Repeat BP check in 4 weeks.',
      prescription: {
        type: PrescriptionType.EXTERNAL,
        notes: 'Monitor BP weekly at home.',
        items: [
          { medicationName: 'Amlodipine 10mg', dosage: '10mg', frequency: 'Once daily', durationDays: 30, quantity: 30, instructions: 'Take in the morning' },
        ],
      },
      cert: { diagnosis: 'Hypertension — medication adjustment', fitForWork: true, offsetDays: 1, notes: 'Fitness pending BP review.' },
      referral: { referredTo: 'Cardiology — Heart Centre', reason: 'Persistent hypertension despite dual therapy — further evaluation', urgency: Urgency.ROUTINE, notes: 'Echo and 24-hour BP monitor requested.' },
    },
  ]

  const patients = [john, john, jane]

  for (let i = 0; i < 3; i++) {
    const patient = patients[i]
    const date = pastDates[i]
    const ed = encounterData[i]

    const completedAppt = await prisma.appointment.create({
      data: {
        patientId: patient.id,
        staffId: drSmith.id,
        scheduledAt: date,
        status: 'COMPLETED',
        reason: ed.reason,
      },
    })

    const encounter = await prisma.encounter.create({
      data: {
        appointmentId: completedAppt.id,
        patientId: patient.id,
        doctorId: drSmith.id,
        chiefComplaint: ed.chiefComplaint,
        examination: ed.examination,
        diagnosis: ed.diagnosis,
        plan: ed.plan,
      },
    })

    await prisma.prescription.create({
      data: {
        encounterId: encounter.id,
        patientId: patient.id,
        doctorId: drSmith.id,
        type: ed.prescription.type,
        status: PrescriptionStatus.ISSUED,
        notes: ed.prescription.notes,
        issuedAt: date,
        items: { create: ed.prescription.items },
      },
    })

    const fromDate = date
    const toDate = new Date(date)
    toDate.setDate(toDate.getDate() + ed.cert.offsetDays)

    await prisma.medicalCertificate.create({
      data: {
        encounterId: encounter.id,
        patientId: patient.id,
        doctorId: drSmith.id,
        diagnosis: ed.cert.diagnosis,
        fitForWork: ed.cert.fitForWork,
        fromDate,
        toDate,
        notes: ed.cert.notes,
        issuedAt: date,
      },
    })

    await prisma.referral.create({
      data: {
        encounterId: encounter.id,
        patientId: patient.id,
        doctorId: drSmith.id,
        referredTo: ed.referral.referredTo,
        reason: ed.referral.reason,
        urgency: ed.referral.urgency,
        notes: ed.referral.notes,
        issuedAt: date,
      },
    })
  }

  console.log('Seeding completed successfully.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
