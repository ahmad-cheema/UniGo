import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { Heading } from "@/components/ui/typography";
import { EligibilityClient } from "./eligibility-client";

export const metadata = { title: "Check Eligibility — UniGo" };

export default async function EligibilityPage() {
  const session = await getSession();
  if (!session) redirect("/sign-in");

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    include: {
      studentProfile: {
        include: {
          testScores: true,
          matches: {
            orderBy: [{ isEligible: "desc" }, { evaluatedAt: "desc" }],
            include: {
              university: {
                select: {
                  id: true,
                  name: true,
                  province: true,
                  annualFeePKR: true,
                  rankingPakistan: true,
                },
              },
              program: {
                select: { id: true, name: true },
              },
            },
          },
        },
      },
    },
  });

  if (!user?.studentProfile) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <span className="text-4xl">⚠️</span>
        <Heading as="h2">Profile not found</Heading>
        <p className="text-sm text-text-secondary">
          Please complete your student profile first.
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

  const sp = user.studentProfile;

  return (
    <EligibilityClient
      studentId={sp.id}
      hasInterPercentage={sp.interPercentage !== null}
      hasTestScores={sp.testScores.length > 0}
      existingMatches={JSON.parse(JSON.stringify(sp.matches))}
      provinces={provinces}
    />
  );
}
