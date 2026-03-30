import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import bcrypt from "bcrypt"
import prisma from "@/lib/db"

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Invalid credentials");
        }

        const patient = await prisma.patient.findUnique({
          where: { email: credentials.email },
        })

        if (patient && patient.password) {
          const isPatientCorrect = await bcrypt.compare(credentials.password, patient.password)
          if (isPatientCorrect) {
            return {
              id: patient.id,
              name: `${patient.firstName} ${patient.lastName}`,
              email: patient.email,
              role: "PATIENT"
            };
          }
        }

        const staff = await prisma.staff.findUnique({
          where: { email: credentials.email },
        })

        if (staff && staff.password) {
          const isStaffCorrect = await bcrypt.compare(credentials.password, staff.password)
          if (isStaffCorrect) {
            return {
              id: staff.id,
              name: staff.name,
              email: staff.email,
              role: staff.role
            };
          }
        }

        throw new Error("Invalid credentials");
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
      }
      return session;
    }
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt"
  },
  secret: process.env.NEXTAUTH_SECRET,
}
