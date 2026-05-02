import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const studentId = Number(id);
  if (!Number.isFinite(studentId)) {
    return NextResponse.json({ error: "Invalid student id" }, { status: 400 });
  }

  const student = await prisma.studentProfile.findUnique({
    where: { id: studentId },
    include: {
      testScores: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!student) {
    return NextResponse.json({ error: "Student not found" }, { status: 404 });
  }

  return NextResponse.json(student);
}

const updateSchema = z.object({
  province: z.string().optional(),
  interests: z.array(z.string()).optional(),
  matricPercentage: z.number().min(0).max(100).nullable().optional(),
  interPercentage: z.number().min(0).max(100).nullable().optional(),
});

export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const studentId = Number(id);
  if (!Number.isFinite(studentId)) {
    return NextResponse.json({ error: "Invalid student id" }, { status: 400 });
  }

  const body = await req.json();
  const parsed = updateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const existing = await prisma.studentProfile.findUnique({
    where: { id: studentId },
    select: { id: true },
  });

  if (!existing) {
    return NextResponse.json({ error: "Student not found" }, { status: 404 });
  }

  const updated = await prisma.studentProfile.update({
    where: { id: studentId },
    data: parsed.data,
    include: {
      testScores: { orderBy: { createdAt: "desc" } },
    },
  });

  return NextResponse.json(updated);
}
