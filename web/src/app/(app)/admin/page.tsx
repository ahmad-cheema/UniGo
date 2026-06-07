import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth/admin";
import { redirect } from "next/navigation";
import { Heading, Text } from "@/components/ui/typography";
import { Card } from "@/components/ui/card";
import { AdminClient } from "./admin-client";

export const metadata = { title: "Admin - UniGo" };

export default async function AdminPage() {
  try {
    await requireAdmin();
  } catch {
    redirect("/dashboard");
  }

  const [universityCount, programCount, criteriaCount, studentsCount] =
    await Promise.all([
      prisma.university.count(),
      prisma.program.count(),
      prisma.eligibilityCriterion.count(),
      prisma.studentProfile.count(),
    ]);

  const [universities, programs, criteria] = await Promise.all([
    prisma.university.findMany({
      take: 80,
      orderBy: [{ rankingPakistan: "asc" }, { name: "asc" }],
      include: { programs: { select: { id: true } } },
    }),
    prisma.program.findMany({
      take: 120,
      orderBy: { name: "asc" },
      include: { university: { select: { id: true, name: true } } },
    }),
    prisma.eligibilityCriterion.findMany({
      take: 120,
      orderBy: { updatedAt: "desc" },
      include: {
        program: {
          select: {
            id: true,
            name: true,
            university: { select: { id: true, name: true } },
          },
        },
      },
    }),
  ]);

  const stats = [
    { label: "Universities", value: universityCount },
    { label: "Programs", value: programCount },
    { label: "Criteria", value: criteriaCount },
    { label: "Students", value: studentsCount },
  ];

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Heading as="h1">Admin Workbench</Heading>
        <Text variant="secondary" size="sm" className="mt-1">
          Maintain university data, programs, and admission criteria.
        </Text>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="py-5">
            <span className="text-2xl font-bold text-text">{stat.value}</span>
            <p className="text-xs text-text-secondary">{stat.label}</p>
          </Card>
        ))}
      </div>

      <AdminClient
        universities={JSON.parse(JSON.stringify(universities))}
        programs={JSON.parse(JSON.stringify(programs))}
        criteria={JSON.parse(JSON.stringify(criteria))}
      />
    </div>
  );
}
