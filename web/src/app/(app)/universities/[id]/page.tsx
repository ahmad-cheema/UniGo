import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth/session";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Heading, Text } from "@/components/ui/typography";
import { Card } from "@/components/ui/card";
import { ShortlistButton } from "@/components/ui/shortlist-button";
import { MatchScoreRing } from "@/components/ui/match-score";

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: Props) {
  const { id } = await params;
  const uni = await prisma.university.findUnique({
    where: { id: Number(id) },
    select: { name: true },
  });
  return { title: uni ? `${uni.name} — UniGo` : "University — UniGo" };
}

export default async function UniversityDetailPage({ params }: Props) {
  const { id } = await params;
  const universityId = Number(id);

  if (!Number.isFinite(universityId)) notFound();

  const uni = await prisma.university.findUnique({
    where: { id: universityId },
    include: {
      programs: {
        orderBy: { name: "asc" },
        include: {
          eligibilityCriteria: { where: { isActive: true } },
        },
      },
    },
  });

  if (!uni) notFound();

  // Fetch shortlist + match data
  const session = await getSession();
  let isShortlisted = false;
  let bestScore: number | null = null;

  if (session) {
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { studentProfile: { select: { id: true } } },
    });
    if (user?.studentProfile) {
      const sl = await prisma.shortlist.findUnique({
        where: {
          studentId_universityId: {
            studentId: user.studentProfile.id,
            universityId,
          },
        },
      });
      isShortlisted = !!sl;

      const topMatch = await prisma.eligibilityMatchResult.findFirst({
        where: { studentId: user.studentProfile.id, universityId },
        orderBy: { matchScore: "desc" },
        select: { matchScore: true },
      });
      bestScore = topMatch?.matchScore ?? null;
    }
  }

  const stats = [
    {
      label: "Pakistan Ranking",
      value: uni.rankingPakistan ? `#${uni.rankingPakistan}` : "—",
      icon: "🏆",
    },
    {
      label: "Annual Fee",
      value: uni.annualFeePKR
        ? `PKR ${uni.annualFeePKR.toLocaleString("en-PK")}`
        : "—",
      icon: "💰",
    },
    {
      label: "Acceptance Rate",
      value: uni.acceptanceRate ? `${uni.acceptanceRate}%` : "—",
      icon: "📊",
    },
    {
      label: "Student : Faculty",
      value: uni.studentFacultyRatio ?? "—",
      icon: "👥",
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-text-secondary">
        <Link
          href="/universities"
          className="hover:text-primary transition-colors"
        >
          Universities
        </Link>
        <span>/</span>
        <span className="text-text font-medium truncate">{uni.name}</span>
      </nav>

      {/* Hero */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <Heading as="h1">{uni.name}</Heading>
          {bestScore !== null && <MatchScoreRing score={bestScore} size={52} />}
          {uni.hecRecognized && (
            <span className="rounded-full bg-primary-light px-3 py-1 text-xs font-semibold text-primary">
              HEC Recognized
            </span>
          )}
          <ShortlistButton
            universityId={uni.id}
            initialShortlisted={isShortlisted}
          />
        </div>
        <div className="flex flex-wrap items-center gap-4 text-sm text-text-secondary">
          <span className="flex items-center gap-1.5">
            📍 {uni.location}, {uni.province}
          </span>
          {uni.type && (
            <span className="flex items-center gap-1.5">🏛 {uni.type}</span>
          )}
          {uni.established && (
            <span className="flex items-center gap-1.5">
              📅 Est. {uni.established}
            </span>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label} className="flex flex-col items-center gap-1 py-4">
            <span className="text-2xl">{s.icon}</span>
            <span className="text-lg font-semibold text-text">{s.value}</span>
            <span className="text-xs text-text-secondary">{s.label}</span>
          </Card>
        ))}
      </div>

      {/* Two-column layout */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Programs */}
        <div className="lg:col-span-2">
          <Card>
            <div className="flex items-center justify-between mb-4">
              <Heading as="h3">Programs Offered</Heading>
              <span className="rounded-full bg-primary-light px-2.5 py-0.5 text-xs font-semibold text-primary">
                {uni.programs.length}
              </span>
            </div>
            {uni.programs.length === 0 ? (
              <Text variant="secondary" size="sm">
                No programs listed yet.
              </Text>
            ) : (
              <div className="flex flex-col gap-2">
                {uni.programs.map((program) => (
                  <div
                    key={program.id}
                    className="flex items-center justify-between rounded-lg border border-border px-4 py-3 transition-colors hover:bg-bg"
                  >
                    <span className="text-sm font-medium text-text">
                      {program.name}
                    </span>
                    {program.eligibilityCriteria.length > 0 && (
                      <div className="flex items-center gap-2 text-xs text-text-secondary">
                        {program.eligibilityCriteria[0].minInterPercentage && (
                          <span>
                            Min Inter:{" "}
                            {program.eligibilityCriteria[0].minInterPercentage}%
                          </span>
                        )}
                        {program.eligibilityCriteria[0].acceptedEntryTests
                          .length > 0 && (
                          <span className="rounded-full bg-bg px-2 py-0.5 border border-border">
                            {program.eligibilityCriteria[0].acceptedEntryTests.join(
                              ", "
                            )}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Sidebar info */}
        <div className="flex flex-col gap-4">
          {/* Entry Tests */}
          <Card>
            <Heading as="h4" className="mb-3">
              Entry Tests
            </Heading>
            <Text variant="secondary" size="sm">
              {uni.entryTestRequired || "No specific entry test requirement listed"}
            </Text>
          </Card>

          {/* Additional Info */}
          <Card>
            <Heading as="h4" className="mb-3">
              Facilities
            </Heading>
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-text-secondary">Hostel</span>
                <span
                  className={`font-medium ${uni.hostelAvailable ? "text-primary" : "text-text-secondary"}`}
                >
                  {uni.hostelAvailable === true
                    ? "Available"
                    : uni.hostelAvailable === false
                      ? "Not Available"
                      : "—"}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-text-secondary">Scholarship</span>
                <span
                  className={`font-medium ${uni.scholarshipAvailable ? "text-primary" : "text-text-secondary"}`}
                >
                  {uni.scholarshipAvailable === true
                    ? "Available"
                    : uni.scholarshipAvailable === false
                      ? "Not Available"
                      : "—"}
                </span>
              </div>
              {uni.campuses && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-text-secondary">Campuses</span>
                  <span className="font-medium text-text">{uni.campuses}</span>
                </div>
              )}
            </div>
          </Card>

          {/* Website */}
          {uni.website && (
            <Card>
              <Heading as="h4" className="mb-3">
                Website
              </Heading>
              <a
                href={
                  uni.website.startsWith("http")
                    ? uni.website
                    : `https://${uni.website}`
                }
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-primary hover:underline break-all"
              >
                {uni.website}
              </a>
            </Card>
          )}

          {/* Deadline */}
          {uni.applicationDeadline && (
            <Card>
              <Heading as="h4" className="mb-3">
                Application Deadline
              </Heading>
              <Text variant="secondary" size="sm">
                {uni.applicationDeadline}
              </Text>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
