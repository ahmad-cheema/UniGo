import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const createTestScoreSchema = z.object({
  testType: z.string().min(2),
  score: z.number().min(0),
  maxScore: z.number().min(1).optional(),
  examDate: z.string().datetime().optional()
});

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const studentId = Number(id);
  if (!Number.isFinite(studentId)) {
    return NextResponse.json({ error: "Invalid student id" }, { status: 400 });
  }

  const student = await prisma.studentProfile.findUnique({
    where: { id: studentId },
    select: { id: true }
  });

  if (!student) {
    return NextResponse.json({ error: "Student not found" }, { status: 404 });
  }

  const body = await req.json();
  const parsed = createTestScoreSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const row = await prisma.testScore.create({
    data: {
      studentId,
      testType: parsed.data.testType,
      score: parsed.data.score,
      maxScore: parsed.data.maxScore ?? null,
      examDate: parsed.data.examDate ? new Date(parsed.data.examDate) : null
    }
  });

  return NextResponse.json(row, { status: 201 });
}