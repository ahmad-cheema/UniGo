import { prisma } from "@/lib/prisma";
import { withAdmin } from "@/lib/admin-api";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const programSchema = z.object({
  id: z.number().int().positive().optional(),
  universityId: z.number().int().positive(),
  name: z.string().min(2),
  description: z.string().nullable().optional(),
});

export async function GET(req: NextRequest) {
  return withAdmin(async () => {
    const url = new URL(req.url);
    const universityId = Number(url.searchParams.get("universityId") ?? "");
    const search = url.searchParams.get("search") ?? "";

    const programs = await prisma.program.findMany({
      where: {
        ...(Number.isFinite(universityId) ? { universityId } : {}),
        ...(search ? { name: { contains: search, mode: "insensitive" } } : {}),
      },
      take: 150,
      orderBy: { name: "asc" },
      include: { university: { select: { id: true, name: true } } },
    });

    return NextResponse.json({ data: programs });
  });
}

export async function POST(req: NextRequest) {
  return withAdmin(async () => {
    const parsed = programSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { id, ...data } = parsed.data;
    const program = id
      ? await prisma.program.update({ where: { id }, data })
      : await prisma.program.create({ data });

    return NextResponse.json(program, { status: id ? 200 : 201 });
  });
}

export async function DELETE(req: NextRequest) {
  return withAdmin(async () => {
    const id = Number(new URL(req.url).searchParams.get("id"));
    if (!Number.isFinite(id)) {
      return NextResponse.json({ error: "Invalid program id" }, { status: 400 });
    }

    await prisma.program.delete({ where: { id } });
    return NextResponse.json({ success: true });
  });
}
