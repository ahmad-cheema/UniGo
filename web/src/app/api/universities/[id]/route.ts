import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const universityId = Number(id);
  if (!Number.isFinite(universityId)) {
    return NextResponse.json(
      { error: "Invalid university id" },
      { status: 400 }
    );
  }

  const university = await prisma.university.findUnique({
    where: { id: universityId },
    include: {
      programs: {
        orderBy: { name: "asc" },
        include: {
          eligibilityCriteria: {
            where: { isActive: true },
          },
        },
      },
    },
  });

  if (!university) {
    return NextResponse.json(
      { error: "University not found" },
      { status: 404 }
    );
  }

  return NextResponse.json(university);
}
