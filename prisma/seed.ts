import { PrismaClient, Role } from '@prisma/client'
import bcrypt from 'bcrypt'

const prisma = new PrismaClient({})

// Built-in admin account. Override via env before running `prisma db seed`.
const ADMIN_NAME = process.env.SEED_ADMIN_NAME ?? 'Admin'
const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL ?? 'admin@clinicpal.com'
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD ?? 'password123'

async function main() {
  const existing = await prisma.staff.findUnique({ where: { email: ADMIN_EMAIL } })

  if (existing) {
    // Keep the existing password; just make sure the account is usable.
    await prisma.staff.update({
      where: { email: ADMIN_EMAIL },
      data: { role: Role.ADMIN, active: true },
    })
    console.log(`Admin account already present: ${ADMIN_EMAIL} (password unchanged)`)
    return
  }

  await prisma.staff.create({
    data: {
      name: ADMIN_NAME,
      email: ADMIN_EMAIL,
      role: Role.ADMIN,
      password: await bcrypt.hash(ADMIN_PASSWORD, 10),
      active: true,
    },
  })

  console.log(`Created admin account: ${ADMIN_EMAIL}`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
