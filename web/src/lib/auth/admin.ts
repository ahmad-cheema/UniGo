import { getSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";

export function getAdminEmails(): string[] {
  return (process.env.ADMIN_EMAILS ?? "admin@unigo.local")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

export function isAdminEmail(email: string): boolean {
  return getAdminEmails().includes(email.toLowerCase());
}

export async function getCurrentUser() {
  const session = await getSession();
  if (!session) return null;

  return prisma.user.findUnique({
    where: { id: session.userId },
    select: {
      id: true,
      email: true,
      fullName: true,
      studentProfile: { select: { id: true } },
    },
  });
}

export async function requireCurrentUser() {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("UNAUTHENTICATED");
  }
  return user;
}

export async function requireAdmin() {
  const user = await requireCurrentUser();
  if (!isAdminEmail(user.email)) {
    throw new Error("FORBIDDEN");
  }
  return user;
}

export async function requireStudentOwner(studentId: number) {
  const user = await requireCurrentUser();
  if (!user.studentProfile || user.studentProfile.id !== studentId) {
    if (!isAdminEmail(user.email)) {
      throw new Error("FORBIDDEN");
    }
  }
  return user;
}
