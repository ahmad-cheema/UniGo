import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const createStudentSchema = z.object({
  fullName: z.string().min(2),
  email: z.string().email(),
  province: z.string().optional(),
  interests: z.array(z.string()).default([]),
  matricPercentage: z.number().min(0).max(100).optional(),
  interPercentage: z.number().min(0).max(100).optional()
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = createStudentSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const student = await prisma.studentProfile.create({
      data: parsed.data
    });

    return NextResponse.json(student, { status: 201 });
  } catch (error: unknown) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as { code?: string }).code === "P2002"
    ) {
      return NextResponse.json(
        { error: "Email already exists" },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: "Failed to create student" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const limit = Math.min(Math.max(Number(url.searchParams.get("limit") ?? 20), 1), 100);

  const students = await prisma.studentProfile.findMany({
    take: limit,
    orderBy: { createdAt: "desc" }
  });

  return NextResponse.json({
    count: students.length,
    data: students
  });
}