import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { DEFAULT_STAFF_PASSWORD } from "@/lib/constants";
import StaffAdminClient from "./StaffAdminClient";

export default async function StaffAdminPage() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    redirect("/staff/dashboard");
  }

  return (
    <StaffAdminClient
      defaultPassword={DEFAULT_STAFF_PASSWORD}
      currentUserId={session.user.id}
    />
  );
}
