import { PrismaClient, Role, InvoiceStatus } from '@prisma/client'
import bcrypt from 'bcrypt'

const prisma = new PrismaClient()

async function main() {
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
