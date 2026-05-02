import { prisma } from "@/lib/prisma";
import { ProgramsClient } from "./programs-client";

export const metadata = { title: "Program Explorer — UniGo" };

export default async function ProgramsPage() {
  const provinces = await prisma.university
    .findMany({
      select: { province: true },
      distinct: ["province"],
      orderBy: { province: "asc" },
    })
    .then((rows) => rows.map((r) => r.province));

  return <ProgramsClient provinces={provinces} />;
}
