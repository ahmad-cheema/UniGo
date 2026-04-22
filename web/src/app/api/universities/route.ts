import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const limit = Number(url.searchParams.get("limit") ?? "20");
  const province = url.searchParams.get("province");

  const universities = await prisma.university.findMany({
    where: province ? { province } : undefined,
    take: Number.isFinite(limit) ? Math.min(Math.max(limit, 1), 100) : 20,
    orderBy: [{ rankingPakistan: "asc" }, { name: "asc" }],
    include: {
      programs: {
        select: { name: true }
      }
    }
  });

  return NextResponse.json({
    count: universities.length,
    data: universities
  });
}