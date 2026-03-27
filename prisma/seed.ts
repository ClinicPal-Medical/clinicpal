import { PrismaClient, Role } from '@prisma/client'
import bcrypt from 'bcrypt'

const prisma = new PrismaClient()

async function main() {
  await prisma.invoice.deleteMany()
  await prisma.appointment.deleteMany()
  await prisma.patient.deleteMany()
  await prisma.staff.deleteMany()

  // 2 Doctors, 1 Receptionist
  await prisma.staff.create({
    data: {
      name: 'Dr. Alice Smith',
      role: Role.DOCTOR,
      email: 'alice.smith@clinicpal.com',
      specialisation: 'General Practice',
      active: true,
    },
  })

  await prisma.staff.create({
    data: {
      name: 'Dr. Bob Jones',
      role: Role.DOCTOR,
      email: 'bob.jones@clinicpal.com',
      specialisation: 'Cardiology',
      active: true,
    },
  })

  await prisma.staff.create({
    data: {
      name: 'Sarah Connor',
      role: Role.RECEPTIONIST,
      email: 'sarah.connor@clinicpal.com',
      active: true,
    },
  })

  // 2 Patients (password: password123)
  const passwordHash = await bcrypt.hash('password123', 10)
  
  await prisma.patient.create({
    data: {
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      password: passwordHash,
      phone: '+1234567890',
      dob: new Date('1980-01-01'),
      notes: 'No known allergies.',
    },
  })

  await prisma.patient.create({
    data: {
      firstName: 'Jane',
      lastName: 'Smith',
      email: 'jane.smith@example.com',
      password: passwordHash,
      phone: '+0987654321',
      dob: new Date('1992-05-15'),
      notes: 'Asthma.',
    },
  })

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
