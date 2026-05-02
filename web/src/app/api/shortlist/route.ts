import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth/session";
import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { studentProfile: { select: { id: true } } },
  });

  if (!user?.studentProfile) {
    return NextResponse.json({ data: [] });
  }

  const items = await prisma.shortlist.findMany({
    where: { studentId: user.studentProfile.id },
    include: {
      university: {
        include: {
          programs: { select: { id: true } },
          matches: {
            where: { studentId: user.studentProfile.id },
            select: { matchScore: true, isEligible: true },
            orderBy: { matchScore: "desc" },
            take: 1,
          },
        },
      },
    },
    orderBy: { addedAt: "desc" },
  });

  return NextResponse.json({ data: items });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { studentProfile: { select: { id: true } } },
  });

  if (!user?.studentProfile) {
    return NextResponse.json({ error: "No student profile" }, { status: 400 });
  }

  const body = await req.json();
  const universityId = Number(body.universityId);

  if (!Number.isFinite(universityId)) {
    return NextResponse.json({ error: "Invalid universityId" }, { status: 400 });
  }

  try {
    const item = await prisma.shortlist.create({
      data: {
        studentId: user.studentProfile.id,
        universityId,
      },
    });
    return NextResponse.json(item, { status: 201 });
  } catch (error: unknown) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as { code?: string }).code === "P2002"
    ) {
      return NextResponse.json(
        { error: "Already shortlisted" },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: "Failed to add to shortlist" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { studentProfile: { select: { id: true } } },
  });

  if (!user?.studentProfile) {
    return NextResponse.json({ error: "No student profile" }, { status: 400 });
  }

  const body = await req.json();
  const universityId = Number(body.universityId);

  await prisma.shortlist.deleteMany({
    where: {
      studentId: user.studentProfile.id,
      universityId,
    },
  });

  return NextResponse.json({ success: true });
}
