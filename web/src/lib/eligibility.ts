import { prisma } from "@/lib/prisma";

type EvaluateInput = {
  studentId: number;
  province?: string;
  maxAnnualFeePKR?: number;
  programKeyword?: string;
  onlyHECRecognized?: boolean;
};

type EvalOutcome = {
  studentId: number;
  universityId: number;
  programId: number;
  isEligible: boolean;
  reasonCodes: string[];
};

function normalize(s: string): string {
  return s.trim().toUpperCase();
}

function toPercent(score: number, maxScore?: number | null): number {
  if (maxScore && maxScore > 0) {
    return (score / maxScore) * 100;
  }
  return score;
}

function bestMatchingTestPercent(
  acceptedTests: string[],
  studentScores: Array<{ testType: string; score: number; maxScore: number | null }>
): number | null {
  if (acceptedTests.length === 0) return null;

  let best: number | null = null;
  const accepted = new Set(acceptedTests.map((x) => normalize(x)));

  for (const ts of studentScores) {
    if (accepted.has(normalize(ts.testType))) {
      const pct = toPercent(ts.score, ts.maxScore);
      if (best === null || pct > best) {
        best = pct;
      }
    }
  }

  return best;
}

function evaluateAgainstCriterion(
  interPercentage: number | null | undefined,
  criterion: {
    minInterPercentage: number | null;
    minEntryTestScore: number | null;
    acceptedEntryTests: string[];
  },
  studentScores: Array<{ testType: string; score: number; maxScore: number | null }>
): { ok: boolean; reasons: string[] } {
  const reasons: string[] = [];

  const minInter = criterion.minInterPercentage ?? 0;
  const minTest = criterion.minEntryTestScore ?? 0;
  const accepted = criterion.acceptedEntryTests ?? [];

  const inter = interPercentage ?? 0;
  if (inter < minInter) {
    reasons.push("LOW_INTER_PERCENTAGE");
  }

  const bestTest = bestMatchingTestPercent(accepted, studentScores);
  if (accepted.length > 0 && bestTest === null) {
    reasons.push("REQUIRED_TEST_NOT_FOUND");
  } else if (bestTest !== null && bestTest < minTest) {
    reasons.push("ENTRY_TEST_SCORE_TOO_LOW");
  }

  return { ok: reasons.length === 0, reasons };
}

export async function evaluateAndPersistEligibility(input: EvaluateInput) {
  const student = await prisma.studentProfile.findUnique({
    where: { id: input.studentId },
    include: { testScores: true }
  });

  if (!student) {
    throw new Error("Student not found");
  }

  const programs = await prisma.program.findMany({
    where: {
      ...(input.programKeyword
        ? { name: { contains: input.programKeyword, mode: "insensitive" } }
        : {}),
      university: {
        ...(input.province ? { province: input.province } : {}),
        ...(typeof input.maxAnnualFeePKR === "number"
          ? { annualFeePKR: { lte: input.maxAnnualFeePKR } }
          : {}),
        ...(input.onlyHECRecognized ? { hecRecognized: true } : {})
      }
    },
    include: {
      university: true,
      eligibilityCriteria: {
        where: { isActive: true }
      }
    }
  });

  const outcomes: EvalOutcome[] = [];

  for (const program of programs) {
    const criteria = program.eligibilityCriteria;

    if (criteria.length === 0) {
      outcomes.push({
        studentId: student.id,
        universityId: program.universityId,
        programId: program.id,
        isEligible: false,
        reasonCodes: ["NO_ACTIVE_CRITERIA"]
      });
      continue;
    }

    let passFound = false;
    let bestReasons: string[] = ["NOT_ELIGIBLE"];

    for (const c of criteria) {
      const result = evaluateAgainstCriterion(student.interPercentage, c, student.testScores);
      if (result.ok) {
        passFound = true;
        bestReasons = [];
        break;
      } else {
        if (bestReasons.length > result.reasons.length) {
          bestReasons = result.reasons;
        } else if (bestReasons.length === 1 && bestReasons[0] === "NOT_ELIGIBLE") {
          bestReasons = result.reasons;
        }
      }
    }

    outcomes.push({
      studentId: student.id,
      universityId: program.universityId,
      programId: program.id,
      isEligible: passFound,
      reasonCodes: passFound ? ["ELIGIBLE"] : bestReasons
    });
  }

  await prisma.eligibilityMatchResult.deleteMany({
    where: { studentId: student.id }
  });

  if (outcomes.length > 0) {
    await prisma.eligibilityMatchResult.createMany({
      data: outcomes.map((o) => ({
        studentId: o.studentId,
        universityId: o.universityId,
        programId: o.programId,
        isEligible: o.isEligible,
        reasonCodes: o.reasonCodes
      }))
    });
  }

  const eligibleCount = outcomes.filter((x) => x.isEligible).length;

  return {
    studentId: student.id,
    totalEvaluated: outcomes.length,
    eligibleCount,
    notEligibleCount: outcomes.length - eligibleCount
  };
}