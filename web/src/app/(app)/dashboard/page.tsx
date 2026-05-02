import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Heading, Text } from "@/components/ui/typography";
import { Card } from "@/components/ui/card";
import { MatchScoreRing } from "@/components/ui/match-score";
import { ShortlistButton } from "@/components/ui/shortlist-button";

export const metadata = { title: "Dashboard — UniGo" };

export default async function DashboardPage() {
  const session = await getSession();
  if (!session) redirect("/sign-in");

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    include: {
      studentProfile: {
        include: {
          testScores: true,
          shortlist: { select: { universityId: true } },
        },
      },
    },
  });

  if (!user?.studentProfile) redirect("/sign-in");

  const sp = user.studentProfile;
  const shortlistedIds = new Set(sp.shortlist.map((s) => s.universityId));

  // Profile completion
  const completionItems = [
    { label: "Province", done: !!sp.province },
    { label: "Matric %", done: sp.matricPercentage !== null },
    { label: "Inter %", done: sp.interPercentage !== null },
    { label: "Test Scores", done: sp.testScores.length > 0 },
  ];
  const completionPct = Math.round(
    (completionItems.filter((i) => i.done).length / completionItems.length) * 100
  );

  // Top matches
  const topMatches = await prisma.eligibilityMatchResult.findMany({
    where: { studentId: sp.id, isEligible: true },
    orderBy: { matchScore: "desc" },
    take: 6,
    include: {
      university: {
        select: {
          id: true,
          name: true,
          province: true,
          location: true,
          annualFeePKR: true,
          rankingPakistan: true,
          scholarshipAvailable: true,
        },
      },
      program: { select: { id: true, name: true } },
    },
  });

  // Quick stats
  const [totalUnis, totalInProvince, shortlistCount] = await Promise.all([
    prisma.university.count(),
    sp.province
      ? prisma.university.count({ where: { province: sp.province } })
      : Promise.resolve(0),
    prisma.shortlist.count({ where: { studentId: sp.id } }),
  ]);

  const eligibleCount = await prisma.eligibilityMatchResult.count({
    where: { studentId: sp.id, isEligible: true },
  });

  // Shortlisted universities
  const shortlisted = await prisma.shortlist.findMany({
    where: { studentId: sp.id },
    take: 4,
    orderBy: { addedAt: "desc" },
    include: {
      university: {
        select: {
          id: true,
          name: true,
          province: true,
          rankingPakistan: true,
        },
      },
    },
  });

  const hasResults = topMatches.length > 0;

  return (
    <div className="flex flex-col gap-6">
      {/* Welcome */}
      <div>
        <Heading as="h1">
          Welcome back, {user.fullName.split(" ")[0]} 👋
        </Heading>
        <Text variant="secondary" size="sm" className="mt-1">
          {hasResults
            ? `You have ${eligibleCount} eligible program matches across ${totalUnis} universities.`
            : "Complete your profile and run an eligibility check to find your best university matches."}
        </Text>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Card className="flex flex-col items-center gap-1 py-4">
          <span className="text-2xl font-bold text-primary">{eligibleCount}</span>
          <span className="text-xs text-text-secondary">Eligible Programs</span>
        </Card>
        <Card className="flex flex-col items-center gap-1 py-4">
          <span className="text-2xl font-bold text-text">{totalUnis}</span>
          <span className="text-xs text-text-secondary">Total Universities</span>
        </Card>
        <Card className="flex flex-col items-center gap-1 py-4">
          <span className="text-2xl font-bold text-text">
            {sp.province ? totalInProvince : "—"}
          </span>
          <span className="text-xs text-text-secondary">
            In {sp.province ?? "Your Province"}
          </span>
        </Card>
        <Card className="flex flex-col items-center gap-1 py-4">
          <span className="text-2xl font-bold text-amber-500">{shortlistCount}</span>
          <span className="text-xs text-text-secondary">Shortlisted</span>
        </Card>
      </div>

      {/* Profile completion CTA */}
      {completionPct < 100 && (
        <Card className="border-amber-200 bg-gradient-to-r from-amber-50 to-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-amber-100 flex items-center justify-center text-xl">
                📝
              </div>
              <div>
                <p className="text-sm font-semibold text-text">
                  Complete your profile — {completionPct}%
                </p>
                <p className="text-xs text-text-secondary mt-0.5">
                  Fill in your academic details for accurate eligibility matching
                </p>
              </div>
            </div>
            <Link
              href="/students"
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover transition-colors"
            >
              Complete Profile
            </Link>
          </div>
        </Card>
      )}

      {/* No results CTA */}
      {!hasResults && completionPct >= 50 && (
        <Card className="border-primary/20 bg-gradient-to-r from-primary-light to-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-xl">
                ✅
              </div>
              <div>
                <p className="text-sm font-semibold text-text">
                  Ready to check eligibility
                </p>
                <p className="text-xs text-text-secondary mt-0.5">
                  Run your first eligibility check to discover matching universities
                </p>
              </div>
            </div>
            <Link
              href="/eligibility"
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover transition-colors"
            >
              Check Now
            </Link>
          </div>
        </Card>
      )}

      {/* Top Matches */}
      {hasResults && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <Heading as="h2">Top Matches For You</Heading>
            <Link
              href="/eligibility"
              className="text-sm text-primary hover:underline font-medium"
            >
              View all →
            </Link>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {topMatches.map((match) => (
              <Link key={match.id} href={`/universities/${match.university.id}`}>
                <Card className="h-full transition-all duration-200 hover:shadow-md hover:border-primary/30 cursor-pointer relative">
                  <div className="absolute top-4 right-4">
                    <ShortlistButton
                      universityId={match.university.id}
                      initialShortlisted={shortlistedIds.has(match.university.id)}
                      size="sm"
                    />
                  </div>
                  <div className="flex items-start gap-4">
                    <MatchScoreRing score={match.matchScore} size={52} />
                    <div className="flex-1 min-w-0 pr-8">
                      <h3 className="text-sm font-semibold text-text truncate">
                        {match.university.name}
                      </h3>
                      <p className="text-xs text-text-secondary mt-0.5">
                        {match.program?.name ?? ""}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs text-text-secondary">
                          📍 {match.university.province}
                        </span>
                        {match.university.rankingPakistan && (
                          <span className="text-xs text-text-secondary">
                            #{match.university.rankingPakistan}
                          </span>
                        )}
                      </div>
                      {match.university.scholarshipAvailable && (
                        <span className="inline-block mt-1.5 rounded-full bg-primary-light px-2 py-0.5 text-[10px] font-semibold text-primary">
                          💰 Scholarship
                        </span>
                      )}
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Shortlisted */}
      {shortlisted.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <Heading as="h2">Your Shortlist ⭐</Heading>
            {shortlistCount > 4 && (
              <Link
                href="/compare"
                className="text-sm text-primary hover:underline font-medium"
              >
                Compare →
              </Link>
            )}
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {shortlisted.map((s) => (
              <Link key={s.id} href={`/universities/${s.university.id}`}>
                <Card className="transition-all duration-200 hover:shadow-md hover:border-primary/30 cursor-pointer">
                  <h3 className="text-sm font-semibold text-text truncate">
                    {s.university.name}
                  </h3>
                  <div className="flex items-center gap-2 mt-1.5 text-xs text-text-secondary">
                    <span>📍 {s.university.province}</span>
                    {s.university.rankingPakistan && (
                      <span>Rank #{s.university.rankingPakistan}</span>
                    )}
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
