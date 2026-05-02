import { prisma } from "@/lib/prisma";
import { Heading } from "@/components/ui/typography";
import { Card } from "@/components/ui/card";

export const metadata = { title: "Reports — UniGo" };

export default async function ReportsPage() {
  const [universityCount, programCount, studentCount, matchCount] =
    await Promise.all([
      prisma.university.count(),
      prisma.program.count(),
      prisma.studentProfile.count(),
      prisma.eligibilityMatchResult.count(),
    ]);

  const eligibleCount = await prisma.eligibilityMatchResult.count({
    where: { isEligible: true },
  });

  const topProvinces = await prisma.university.groupBy({
    by: ["province"],
    _count: { id: true },
    orderBy: { _count: { id: "desc" } },
    take: 10,
  });

  const stats = [
    { label: "Universities", value: universityCount, icon: "🏛" },
    { label: "Programs", value: programCount, icon: "📖" },
    { label: "Students", value: studentCount, icon: "👤" },
    { label: "Evaluations", value: matchCount, icon: "✅" },
  ];

  return (
    <div className="flex flex-col gap-6">
      <Heading as="h1">Reports</Heading>

      {/* Overview stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label} className="flex flex-col items-center gap-1 py-5">
            <span className="text-2xl">{s.icon}</span>
            <span className="text-2xl font-bold text-text">{s.value}</span>
            <span className="text-xs text-text-secondary">{s.label}</span>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Eligibility summary */}
        <Card>
          <Heading as="h3" className="mb-4">
            Eligibility Overview
          </Heading>
          {matchCount === 0 ? (
            <p className="text-sm text-text-secondary">
              No evaluations have been run yet.
            </p>
          ) : (
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-text-secondary">
                  Eligible matches
                </span>
                <span className="text-sm font-semibold text-primary">
                  {eligibleCount}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-text-secondary">
                  Not eligible
                </span>
                <span className="text-sm font-semibold text-text-secondary">
                  {matchCount - eligibleCount}
                </span>
              </div>
              {/* Bar */}
              <div className="h-3 w-full rounded-full bg-border overflow-hidden">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-500"
                  style={{
                    width: `${matchCount > 0 ? (eligibleCount / matchCount) * 100 : 0}%`,
                  }}
                />
              </div>
              <span className="text-xs text-text-secondary text-center">
                {matchCount > 0
                  ? `${((eligibleCount / matchCount) * 100).toFixed(1)}% eligibility rate`
                  : ""}
              </span>
            </div>
          )}
        </Card>

        {/* Universities by province */}
        <Card>
          <Heading as="h3" className="mb-4">
            Universities by Province
          </Heading>
          <div className="flex flex-col gap-2">
            {topProvinces.map((p) => (
              <div
                key={p.province}
                className="flex items-center justify-between text-sm"
              >
                <span className="text-text">{p.province}</span>
                <div className="flex items-center gap-3">
                  <div className="w-24 h-2 rounded-full bg-border overflow-hidden">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{
                        width: `${(p._count.id / universityCount) * 100}%`,
                      }}
                    />
                  </div>
                  <span className="text-text-secondary text-xs w-6 text-right">
                    {p._count.id}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
