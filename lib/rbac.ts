import { getServerSession } from "next-auth/next";
import { authOptions } from "./auth";
import { NextResponse } from "next/server";
import { Role } from "@prisma/client";

export async function requireRole(allowedRoles: Role[]): Promise<{ authorized: boolean; session?: any; response?: NextResponse }> {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    return { authorized: false, response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  if (!allowedRoles.includes(session.user.role as Role)) {
    return { authorized: false, response: NextResponse.json({ error: "Forbidden - Insufficient permissions" }, { status: 403 }) };
  }

  return { authorized: true, session };
}
