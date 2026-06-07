import { evaluateAndPersistEligibility } from "@/lib/eligibility";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireStudentOwner } from "@/lib/auth/admin";
import { authErrorResponse } from "@/lib/api-errors";

const evaluateSchema = z.object({
  studentId: z.number().int().positive(),
  province: z.string().optional(),
  maxAnnualFeePKR: z.number().int().positive().optional(),
  programKeyword: z.string().optional(),
  onlyHECRecognized: z.boolean().optional()
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = evaluateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    await requireStudentOwner(parsed.data.studentId);
    const result = await evaluateAndPersistEligibility(parsed.data);
    return NextResponse.json(result);
  } catch (error: unknown) {
    const authError = authErrorResponse(error);
    if (authError) return authError;

    if (error instanceof Error && error.message === "Student not found") {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }
    return NextResponse.json(
      { error: "Eligibility evaluation failed" },
      { status: 500 }
    );
  }
}
