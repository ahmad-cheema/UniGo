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
  matchScore: number;
  reasonCodes: string[];
};

type CriterionLike = {
  minMatricPercentage: number | null;
  minInterPercentage: number | null;
  minEntryTestScore: number | null;
  acceptedEntryTests: string[];
  requiredSubjects: string[];
};

type TestScoreLike = {
  testType: string;
  score: number;
  maxScore: number | null;
};

type AcademicRecordLike = {
  subject: string;
  percentage: number | null;
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
  studentScores: TestScoreLike[]
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

function hasRequiredSubjects(
  requiredSubjects: string[],
  academicRecords: AcademicRecordLike[]
): boolean {
  if (requiredSubjects.length === 0) return true;

  const availableSubjects = new Set(
    academicRecords.map((record) => normalize(record.subject))
  );

  return requiredSubjects.every((subject) =>
    availableSubjects.has(normalize(subject))
  );
}

function evaluateAgainstCriterion(
  matricPercentage: number | null | undefined,
  interPercentage: number | null | undefined,
  criterion: CriterionLike,
  studentScores: TestScoreLike[],
  academicRecords: AcademicRecordLike[]
): { ok: boolean; reasons: string[] } {
  const reasons: string[] = [];

  const minMatric = criterion.minMatricPercentage ?? 0;
  const matric = matricPercentage ?? 0;
  if (matric < minMatric) {
    reasons.push("LOW_MATRIC_PERCENTAGE");
  }

  const minInter = criterion.minInterPercentage ?? 0;
  const inter = interPercentage ?? 0;
  if (inter < minInter) {
    reasons.push("LOW_INTER_PERCENTAGE");
  }

  if (!hasRequiredSubjects(criterion.requiredSubjects ?? [], academicRecords)) {
    reasons.push("REQUIRED_SUBJECT_NOT_FOUND");
  }

  const minTest = criterion.minEntryTestScore ?? 0;
  const accepted = criterion.acceptedEntryTests ?? [];
  const bestTest = bestMatchingTestPercent(accepted, studentScores);
  if (accepted.length > 0 && bestTest === null) {
    reasons.push("REQUIRED_TEST_NOT_FOUND");
  } else if (bestTest !== null && bestTest < minTest) {
    reasons.push("ENTRY_TEST_SCORE_TOO_LOW");
  }

  return { ok: reasons.length === 0, reasons };
}

function scorePercentage(value: number, minimum: number, passBase: number, bonus: number) {
  if (value >= minimum) {
    return passBase + Math.min(bonus, Math.round((value - minimum) / 4));
  }
  if (minimum <= 0) return passBase + bonus;
  return Math.max(0, Math.round((value / minimum) * Math.max(1, passBase - 4)));
}

function computeMatchScore(
  matricPercentage: number | null | undefined,
  interPercentage: number | null | undefined,
  criterion: CriterionLike,
  studentScores: TestScoreLike[],
  academicRecords: AcademicRecordLike[],
  university: {
    province: string;
    scholarshipAvailable: boolean | null;
    hostelAvailable: boolean | null;
    hecRecognized: boolean;
  },
  studentProvince: string | null
): number {
  let score = 0;

  score += scorePercentage(
    matricPercentage ?? 0,
    criterion.minMatricPercentage ?? 50,
    10,
    5
  );

  score += scorePercentage(
    interPercentage ?? 0,
    criterion.minInterPercentage ?? 50,
    22,
    8
  );

  const minTest = criterion.minEntryTestScore ?? 0;
  const accepted = criterion.acceptedEntryTests ?? [];
  const bestTest = bestMatchingTestPercent(accepted, studentScores);
  if (accepted.length === 0 || minTest === 0) {
    score += 30;
  } else if (bestTest !== null) {
    score += scorePercentage(bestTest, minTest, 22, 8);
  }

  const requiredSubjects = criterion.requiredSubjects ?? [];
  if (requiredSubjects.length === 0) {
    score += 10;
  } else {
    const availableSubjects = new Set(
      academicRecords.map((record) => normalize(record.subject))
    );
    const matched = requiredSubjects.filter((subject) =>
      availableSubjects.has(normalize(subject))
    ).length;
    score += Math.round((matched / requiredSubjects.length) * 10);
  }

  if (studentProvince && university.province === studentProvince) score += 5;
  if (university.scholarshipAvailable) score += 4;
  if (university.hostelAvailable) score += 3;
  if (university.hecRecognized) score += 2;
  score += 1;

  return Math.min(100, Math.max(0, score));
}

export async function evaluateAndPersistEligibility(input: EvaluateInput) {
  const student = await prisma.studentProfile.findUnique({
    where: { id: input.studentId },
    include: { testScores: true, academicRecords: true },
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
        ...(input.onlyHECRecognized ? { hecRecognized: true } : {}),
      },
    },
    include: {
      university: true,
      eligibilityCriteria: {
        where: { isActive: true },
      },
    },
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
        matchScore: computeMatchScore(
          student.matricPercentage,
          student.interPercentage,
          {
            minMatricPercentage: null,
            minInterPercentage: null,
            minEntryTestScore: null,
            acceptedEntryTests: [],
            requiredSubjects: [],
          },
          student.testScores,
          student.academicRecords,
          program.university,
          student.province
        ),
        reasonCodes: ["NO_ACTIVE_CRITERIA"],
      });
      continue;
    }

    let passFound = false;
    let bestReasons: string[] = ["NOT_ELIGIBLE"];
    let bestScore = 0;

    for (const c of criteria) {
      const result = evaluateAgainstCriterion(
        student.matricPercentage,
        student.interPercentage,
        c,
        student.testScores,
        student.academicRecords
      );
      const score = computeMatchScore(
        student.matricPercentage,
        student.interPercentage,
        c,
        student.testScores,
        student.academicRecords,
        program.university,
        student.province
      );

      if (score > bestScore) {
        bestScore = score;
      }

      if (result.ok) {
        passFound = true;
        bestReasons = [];
        break;
      } else if (
        bestReasons.length > result.reasons.length ||
        (bestReasons.length === 1 && bestReasons[0] === "NOT_ELIGIBLE")
      ) {
        bestReasons = result.reasons;
      }
    }

    outcomes.push({
      studentId: student.id,
      universityId: program.universityId,
      programId: program.id,
      isEligible: passFound,
      matchScore: bestScore,
      reasonCodes: passFound ? ["ELIGIBLE"] : bestReasons,
    });
  }

  await prisma.eligibilityMatchResult.deleteMany({
    where: { studentId: student.id },
  });

  if (outcomes.length > 0) {
    await prisma.eligibilityMatchResult.createMany({
      data: outcomes.map((o) => ({
        studentId: o.studentId,
        universityId: o.universityId,
        programId: o.programId,
        isEligible: o.isEligible,
        matchScore: o.matchScore,
        reasonCodes: o.reasonCodes,
      })),
    });
  }

  const eligibleCount = outcomes.filter((x) => x.isEligible).length;

  return {
    studentId: student.id,
    totalEvaluated: outcomes.length,
    eligibleCount,
    notEligibleCount: outcomes.length - eligibleCount,
  };
}
