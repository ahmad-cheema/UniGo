import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { Heading, Text } from "@/components/ui/typography";
import { StudyPlansClient } from "./study-plans-client";

export const metadata = { title: "Study Plans - UniGo" };

export default async function StudyPlansPage() {
  const session = await getSession();
  if (!session) redirect("/sign-in");

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    include: {
      studentProfile: {
        include: {
          studyPlans: { orderBy: { generatedAt: "desc" } },
          matches: {
            where: { isEligible: true },
            orderBy: { matchScore: "desc" },
            take: 20,
            include: {
              university: { select: { id: true, name: true } },
              program: { select: { id: true, name: true } },
            },
          },
        },
      },
    },
  });

  if (!user?.studentProfile) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <Heading as="h2">Profile not found</Heading>
        <p className="text-sm text-text-secondary">
          Please create a student profile first.
        </p>
      </div>
    );
  }

  const targets = user.studentProfile.matches
    .filter((match) => match.program)
    .map((match) => ({
      programId: match.program!.id,
      universityId: match.university.id,
      label: `${match.program!.name} - ${match.university.name}`,
    }));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Heading as="h1">Study Plans</Heading>
        <Text variant="secondary" size="sm" className="mt-1">
          Generate AI-backed preparation plans from your profile and eligibility gaps.
        </Text>
      </div>

      <StudyPlansClient
        targets={targets}
        studyPlans={JSON.parse(JSON.stringify(user.studentProfile.studyPlans))}
      />
    </div>
  );
}
