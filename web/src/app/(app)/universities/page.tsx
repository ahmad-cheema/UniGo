import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth/session";
import Link from "next/link";
import { Heading, Text } from "@/components/ui/typography";
import { Card } from "@/components/ui/card";
import { UniversitiesFilter } from "./universities-filter";
import { ShortlistButton } from "@/components/ui/shortlist-button";
import { MatchScoreBadge } from "@/components/ui/match-score";

export const metadata = {
  title: "Universities — UniGo",
};

type Props = {
  searchParams: Promise<{
    province?: string;
    search?: string;
    hec?: string;
  }>;
};

export default async function UniversitiesPage({ searchParams }: Props) {
  const params = await searchParams;
  const session = await getSession();

  const where: Record<string, unknown> = {};

  if (params.province && params.province !== "all") {
    where.province = params.province;
  }
  if (params.hec === "true") {
    where.hecRecognized = true;
  }
  if (params.search) {
    where.name = { contains: params.search, mode: "insensitive" };
  }

  // Get student profile for shortlist + match data
  let shortlistedIds = new Set<number>();
  let matchScores = new Map<number, number>();
  let studentId: number | null = null;

  if (session) {
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: {
        studentProfile: {
          select: {
            id: true,
            shortlist: { select: { universityId: true } },
          },
        },
      },
    });

    if (user?.studentProfile) {
      studentId = user.studentProfile.id;
      shortlistedIds = new Set(
        user.studentProfile.shortlist.map((s) => s.universityId)
      );

      // Get best match score per university
      const matches = await prisma.eligibilityMatchResult.findMany({
        where: { studentId: user.studentProfile.id },
        select: { universityId: true, matchScore: true },
        orderBy: { matchScore: "desc" },
      });
      for (const m of matches) {
        if (m.matchScore !== null && !matchScores.has(m.universityId)) {
          matchScores.set(m.universityId, m.matchScore);
        }
      }
    }
  }

  const [universities, provinces] = await Promise.all([
    prisma.university.findMany({
      where,
      include: { programs: { select: { id: true } } },
      orderBy: [{ rankingPakistan: "asc" }, { name: "asc" }],
    }),
    prisma.university
      .findMany({
        select: { province: true },
        distinct: ["province"],
        orderBy: { province: "asc" },
      })
      .then((rows) => rows.map((r) => r.province)),
  ]);

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Heading as="h1">Universities</Heading>
          <span className="inline-flex items-center rounded-full bg-primary-light px-3 py-1 text-xs font-semibold text-primary">
            {universities.length}
          </span>
        </div>
      </div>

      {/* Filters */}
      <UniversitiesFilter
        provinces={provinces}
        currentProvince={params.province ?? "all"}
        currentSearch={params.search ?? ""}
        currentHec={params.hec === "true"}
      />

      {/* Grid */}
      {universities.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-2">
          <span className="text-4xl">🔍</span>
          <Text variant="secondary">
            No universities found matching your filters.
          </Text>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {universities.map((uni) => {
            const score = matchScores.get(uni.id);
            return (
              <Link key={uni.id} href={`/universities/${uni.id}`}>
                <Card className="h-full transition-shadow duration-200 hover:shadow-md hover:border-primary/30 cursor-pointer relative">
                  {/* Shortlist button */}
                  <div className="absolute top-4 right-4 z-10">
                    <ShortlistButton
                      universityId={uni.id}
                      initialShortlisted={shortlistedIds.has(uni.id)}
                      size="sm"
                    />
                  </div>

                  <div className="flex flex-col gap-3">
                    {/* Name + HEC + Score */}
                    <div className="flex items-start gap-2 pr-10">
                      <h3 className="text-sm font-semibold text-text leading-snug line-clamp-2 flex-1">
                        {uni.name}
                      </h3>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {score !== undefined && (
                          <MatchScoreBadge score={score} size="sm" />
                        )}
                        {uni.hecRecognized && (
                          <span className="rounded-full bg-primary-light px-2 py-0.5 text-[10px] font-semibold text-primary">
                            HEC
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Location */}
                    <div className="flex items-center gap-1.5 text-xs text-text-secondary">
                      <span>📍</span>
                      <span>
                        {uni.location}
                        {uni.province ? `, ${uni.province}` : ""}
                      </span>
                    </div>

                    {/* Badges row */}
                    <div className="flex flex-wrap gap-1.5">
                      {uni.type && (
                        <span className="rounded-full border border-border px-2 py-0.5 text-[10px] font-medium text-text-secondary">
                          {uni.type}
                        </span>
                      )}
                      {uni.rankingPakistan && (
                        <span className="rounded-full border border-border px-2 py-0.5 text-[10px] font-medium text-text-secondary">
                          Rank #{uni.rankingPakistan}
                        </span>
                      )}
                      <span className="rounded-full border border-border px-2 py-0.5 text-[10px] font-medium text-text-secondary">
                        {uni.programs.length} programs
                      </span>
                    </div>

                    {/* Fee */}
                    {uni.annualFeePKR && (
                      <div className="flex items-center justify-between border-t border-border pt-3 mt-1">
                        <span className="text-xs text-text-secondary">
                          Annual Fee
                        </span>
                        <span className="text-sm font-semibold text-text">
                          PKR{" "}
                          {uni.annualFeePKR.toLocaleString("en-PK")}
                        </span>
                      </div>
                    )}
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
