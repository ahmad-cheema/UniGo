import { prisma } from "@/lib/prisma";
import { withAdmin } from "@/lib/admin-api";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const criterionSchema = z.object({
  id: z.number().int().positive().optional(),
  programId: z.number().int().positive(),
  minMatricPercentage: z.number().min(0).max(100).nullable().optional(),
  minInterPercentage: z.number().min(0).max(100).nullable().optional(),
  minEntryTestScore: z.number().min(0).max(100).nullable().optional(),
  acceptedEntryTests: z.array(z.string()).default([]),
  requiredSubjects: z.array(z.string()).default([]),
  isActive: z.boolean().default(true),
});

export async function GET(req: NextRequest) {
  return withAdmin(async () => {
    const programId = Number(new URL(req.url).searchParams.get("programId") ?? "");
    const criteria = await prisma.eligibilityCriterion.findMany({
      where: Number.isFinite(programId) ? { programId } : undefined,
      take: 150,
      orderBy: { updatedAt: "desc" },
      include: {
        program: {
          select: {
            id: true,
            name: true,
            university: { select: { id: true, name: true } },
          },
        },
      },
    });

    return NextResponse.json({ data: criteria });
  });
}

export async function POST(req: NextRequest) {
  return withAdmin(async () => {
    const parsed = criterionSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { id, ...data } = parsed.data;
    const criterion = id
      ? await prisma.eligibilityCriterion.update({ where: { id }, data })
      : await prisma.eligibilityCriterion.create({ data });

    return NextResponse.json(criterion, { status: id ? 200 : 201 });
  });
}

export async function DELETE(req: NextRequest) {
  return withAdmin(async () => {
    const id = Number(new URL(req.url).searchParams.get("id"));
    if (!Number.isFinite(id)) {
      return NextResponse.json({ error: "Invalid criterion id" }, { status: 400 });
    }

    await prisma.eligibilityCriterion.delete({ where: { id } });
    return NextResponse.json({ success: true });
  });
}
