import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { requireStudentOwner } from "@/lib/auth/admin";
import { authErrorResponse } from "@/lib/api-errors";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const studentId = Number(id);
  if (!Number.isFinite(studentId)) {
    return NextResponse.json({ error: "Invalid student id" }, { status: 400 });
  }

  try {
    await requireStudentOwner(studentId);
  } catch (error) {
    const authError = authErrorResponse(error);
    if (authError) return authError;
    return NextResponse.json({ error: "Failed to load matches" }, { status: 500 });
  }

  const url = new URL(req.url);
  const eligibleOnly = url.searchParams.get("eligibleOnly") === "true";
  const limit = Math.min(Math.max(Number(url.searchParams.get("limit") ?? 50), 1), 200);

  const matches = await prisma.eligibilityMatchResult.findMany({
    where: {
      studentId,
      ...(eligibleOnly ? { isEligible: true } : {})
    },
    take: limit,
    orderBy: [{ matchScore: "desc" }, { isEligible: "desc" }],
    include: {
      university: {
        select: {
          id: true,
          name: true,
          province: true,
          annualFeePKR: true,
          rankingPakistan: true,
          entryTestRequired: true
        }
      },
      program: {
        select: {
          id: true,
          name: true
        }
      }
    }
  });

  return NextResponse.json({
    count: matches.length,
    data: matches
  });
}
