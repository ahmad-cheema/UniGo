import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

function normalizeTestName(input: string): string {
  const t = input.trim().toUpperCase();

  if (t.includes("MDCAT")) return "MDCAT";
  if (t.includes("ECAT")) return "ECAT";
  if (t.includes("HAT")) return "HAT";
  if (t.includes("NTS")) return "NTS";
  if (t.includes("AIOU")) return "AIOU Own Test";
  if (t.includes("IBA")) return "IBA Entry Test";
  if (t.includes("ISSB") || t.includes("PAF")) return "ISSB / PAF Selection Test";
  if (t.includes("UNIVERSITY OWN TEST") || t.includes("OWN TEST")) return "University Own Test";

  return input.trim();
}

function parseAcceptedTests(entryTestRequired?: string | null): string[] {
  if (!entryTestRequired || !entryTestRequired.trim()) {
    return ["University Own Test"];
  }

  const tokens = entryTestRequired
    .split(/[;,/|]/g)
    .map((x) => normalizeTestName(x))
    .filter((x) => x.length > 0);

  const unique = Array.from(new Set(tokens));
  return unique.length > 0 ? unique : ["University Own Test"];
}

function defaultMinEntryScore(acceptedTests: string[]): number {
  const scoreByTest: Record<string, number> = {
    "MDCAT": 60,
    "ECAT": 55,
    "HAT": 50,
    "NTS": 50,
    "University Own Test": 50,
    "AIOU Own Test": 45,
    "IBA Entry Test": 55,
    "ISSB / PAF Selection Test": 60
  };

  let maxScore = 50;
  for (const test of acceptedTests) {
    const score = scoreByTest[test];
    if (typeof score === "number" && score > maxScore) {
      maxScore = score;
    }
  }
  return maxScore;
}

async function main() {
  const programs = await prisma.program.findMany({
    include: {
      university: true,
      eligibilityCriteria: true
    }
  });

  let created = 0;
  let skipped = 0;

  for (const program of programs) {
    if (program.eligibilityCriteria.length > 0) {
      skipped += 1;
      continue;
    }

    const acceptedTests = parseAcceptedTests(program.university.entryTestRequired);
    const minEntryTestScore = defaultMinEntryScore(acceptedTests);

    await prisma.eligibilityCriterion.create({
      data: {
        programId: program.id,
        minInterPercentage: 50,
        minEntryTestScore,
        acceptedEntryTests: acceptedTests,
        isActive: true
      }
    });

    created += 1;
  }

  console.log(`Criteria created: ${created}`);
  console.log(`Programs skipped (already had criteria): ${skipped}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });