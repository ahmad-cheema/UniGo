import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { Heading } from "@/components/ui/typography";
import { ProfileClient } from "./profile-client";

export const metadata = { title: "My Profile — UniGo" };

export default async function StudentsPage() {
  const session = await getSession();
  if (!session) redirect("/sign-in");

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    include: {
      studentProfile: {
        include: {
          testScores: { orderBy: { createdAt: "desc" } },
        },
      },
    },
  });

  if (!user || !user.studentProfile) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <span className="text-4xl">⚠️</span>
        <Heading as="h2">Profile not found</Heading>
        <p className="text-sm text-text-secondary">
          Your student profile could not be loaded.
        </p>
      </div>
    );
  }

  const provinces = await prisma.university
    .findMany({
      select: { province: true },
      distinct: ["province"],
      orderBy: { province: "asc" },
    })
    .then((rows) => rows.map((r) => r.province));

  return (
    <ProfileClient
      profile={JSON.parse(JSON.stringify(user.studentProfile))}
      provinces={provinces}
    />
  );
}
