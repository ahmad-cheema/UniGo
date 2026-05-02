import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const search = url.searchParams.get("search") ?? "";
  const province = url.searchParams.get("province");
  const limit = Math.min(
    Math.max(Number(url.searchParams.get("limit") ?? 50), 1),
    200
  );

  if (!search || search.length < 2) {
    return NextResponse.json({ data: [] });
  }

  const programs = await prisma.program.findMany({
    where: {
      name: { contains: search, mode: "insensitive" },
      ...(province
        ? { university: { province } }
        : {}),
    },
    take: limit,
    orderBy: [
      { university: { rankingPakistan: "asc" } },
      { name: "asc" },
    ],
    include: {
      university: {
        select: {
          id: true,
          name: true,
          province: true,
          location: true,
          annualFeePKR: true,
          rankingPakistan: true,
          hecRecognized: true,
          scholarshipAvailable: true,
          hostelAvailable: true,
          entryTestRequired: true,
        },
      },
      eligibilityCriteria: {
        where: { isActive: true },
        take: 1,
      },
    },
  });

  return NextResponse.json({ count: programs.length, data: programs });
}
