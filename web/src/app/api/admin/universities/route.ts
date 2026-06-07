import { prisma } from "@/lib/prisma";
import { withAdmin } from "@/lib/admin-api";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const universitySchema = z.object({
  id: z.number().int().positive().optional(),
  name: z.string().min(2),
  location: z.string().min(1),
  province: z.string().min(1),
  established: z.number().int().nullable().optional(),
  type: z.string().nullable().optional(),
  annualFeePKR: z.number().int().nullable().optional(),
  rankingPakistan: z.number().int().nullable().optional(),
  hecRecognized: z.boolean().default(true),
  entryTestRequired: z.string().nullable().optional(),
  hostelAvailable: z.boolean().nullable().optional(),
  scholarshipAvailable: z.boolean().nullable().optional(),
  website: z.string().url().nullable().optional(),
});

export async function GET(req: NextRequest) {
  return withAdmin(async () => {
    const search = new URL(req.url).searchParams.get("search") ?? "";
    const universities = await prisma.university.findMany({
      where: search ? { name: { contains: search, mode: "insensitive" } } : undefined,
      take: 100,
      orderBy: [{ rankingPakistan: "asc" }, { name: "asc" }],
      include: { programs: { select: { id: true } } },
    });

    return NextResponse.json({ data: universities });
  });
}

export async function POST(req: NextRequest) {
  return withAdmin(async () => {
    const parsed = universitySchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { id, ...data } = parsed.data;
    const university = id
      ? await prisma.university.update({ where: { id }, data })
      : await prisma.university.create({ data: { ...data, programsOfferedRaw: "" } });

    return NextResponse.json(university, { status: id ? 200 : 201 });
  });
}

export async function DELETE(req: NextRequest) {
  return withAdmin(async () => {
    const id = Number(new URL(req.url).searchParams.get("id"));
    if (!Number.isFinite(id)) {
      return NextResponse.json({ error: "Invalid university id" }, { status: 400 });
    }

    await prisma.university.delete({ where: { id } });
    return NextResponse.json({ success: true });
  });
}
