import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { CompareClient } from "./compare-client";

export const metadata = { title: "Compare Universities — UniGo" };

type Props = {
  searchParams: Promise<{ ids?: string }>;
};

export default async function ComparePage({ searchParams }: Props) {
  const session = await getSession();
  if (!session) redirect("/sign-in");

  const params = await searchParams;
  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { studentProfile: { select: { id: true } } },
  });

  const studentId = user?.studentProfile?.id;

  // Pre-selected university IDs from URL
  const selectedIds = (params.ids ?? "")
    .split(",")
    .map(Number)
    .filter(Number.isFinite);

  // Fetch selected universities
  let selected: Array<Record<string, unknown>> = [];
  if (selectedIds.length > 0) {
    selected = await prisma.university.findMany({
      where: { id: { in: selectedIds } },
      include: {
        programs: { select: { id: true, name: true } },
        ...(studentId
          ? {
              matches: {
                where: { studentId },
                select: { matchScore: true, isEligible: true },
                orderBy: { matchScore: "desc" },
                take: 1,
              },
            }
          : {}),
      },
    });
  }

  // Fetch shortlisted universities for the picker
  const shortlisted = studentId
    ? await prisma.shortlist.findMany({
        where: { studentId },
        include: {
          university: {
            select: { id: true, name: true, province: true },
          },
        },
        orderBy: { addedAt: "desc" },
      })
    : [];

  return (
    <CompareClient
      selectedUniversities={JSON.parse(JSON.stringify(selected))}
      shortlisted={JSON.parse(
        JSON.stringify(shortlisted.map((s) => s.university))
      )}
    />
  );
}
