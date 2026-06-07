import { authErrorResponse } from "@/lib/api-errors";
import { requireCurrentUser } from "@/lib/auth/admin";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const promptVersion = "study-plan-v1";

const createStudyPlanSchema = z.object({
  programId: z.number().int().positive().optional(),
  universityId: z.number().int().positive().optional(),
});

function extractJson(text: string) {
  try {
    return JSON.parse(text);
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) throw new Error("Model did not return JSON");
    return JSON.parse(match[0]);
  }
}

async function callOpenAI(input: string) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY_MISSING");
  }

  const model = process.env.OPENAI_MODEL || "gpt-4.1-mini";
  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "You create concise Pakistani university admission study plans. Return valid JSON only with keys title, summary, weeklyPlan, focusAreas, resources, milestones, and cautions.",
        },
        { role: "user", content: input },
      ],
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`OPENAI_FAILED:${text.slice(0, 300)}`);
  }

  const data = await res.json();
  const content = data.choices?.[0]?.message?.content;
  if (typeof content !== "string") {
    throw new Error("OPENAI_EMPTY_RESPONSE");
  }

  return { model, json: extractJson(content) };
}

export async function GET() {
  try {
    const user = await requireCurrentUser();
    if (!user.studentProfile) {
      return NextResponse.json({ error: "No student profile" }, { status: 400 });
    }

    const studyPlans = await prisma.studyPlan.findMany({
      where: { studentId: user.studentProfile.id },
      orderBy: { generatedAt: "desc" },
    });

    return NextResponse.json({ data: studyPlans });
  } catch (error) {
    const authError = authErrorResponse(error);
    if (authError) return authError;
    return NextResponse.json({ error: "Failed to load study plans" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await requireCurrentUser();
    if (!user.studentProfile) {
      return NextResponse.json({ error: "No student profile" }, { status: 400 });
    }

    const parsed = createStudyPlanSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const student = await prisma.studentProfile.findUnique({
      where: { id: user.studentProfile.id },
      include: {
        academicRecords: true,
        testScores: true,
        matches: {
          where: {
            ...(parsed.data.universityId ? { universityId: parsed.data.universityId } : {}),
            ...(parsed.data.programId ? { programId: parsed.data.programId } : {}),
          },
          include: {
            university: { select: { name: true, province: true, entryTestRequired: true } },
            program: { select: { name: true } },
          },
          orderBy: [{ isEligible: "desc" }, { matchScore: "desc" }],
          take: 8,
        },
      },
    });

    if (!student) {
      return NextResponse.json({ error: "Student not found" }, { status: 404 });
    }

    const targetProgram = parsed.data.programId
      ? await prisma.program.findUnique({
          where: { id: parsed.data.programId },
          include: {
            university: true,
            eligibilityCriteria: { where: { isActive: true } },
          },
        })
      : null;

    const prompt = JSON.stringify({
      student: {
        province: student.province,
        interests: student.interests,
        matricPercentage: student.matricPercentage,
        interPercentage: student.interPercentage,
        academicRecords: student.academicRecords.map((record) => ({
          level: record.level,
          subject: record.subject,
          percentage: record.percentage,
          grade: record.grade,
        })),
        testScores: student.testScores.map((score) => ({
          testType: score.testType,
          score: score.score,
          maxScore: score.maxScore,
        })),
      },
      target: targetProgram
        ? {
            university: targetProgram.university.name,
            program: targetProgram.name,
            criteria: targetProgram.eligibilityCriteria,
          }
        : "Use the best available eligible and near-eligible matches.",
      recentEligibilityResults: student.matches.map((match) => ({
        university: match.university.name,
        program: match.program?.name,
        isEligible: match.isEligible,
        matchScore: match.matchScore,
        reasonCodes: match.reasonCodes,
        entryTestRequired: match.university.entryTestRequired,
      })),
      requiredShape: {
        title: "string",
        summary: "string",
        weeklyPlan: [{ week: "string", goals: ["string"], tasks: ["string"] }],
        focusAreas: ["string"],
        resources: ["string"],
        milestones: ["string"],
        cautions: ["string"],
      },
    });

    const result = await callOpenAI(prompt);
    const studyPlan = await prisma.studyPlan.create({
      data: {
        studentId: student.id,
        modelName: result.model,
        promptVersion,
        planJson: result.json,
      },
    });

    return NextResponse.json(studyPlan, { status: 201 });
  } catch (error) {
    const authError = authErrorResponse(error);
    if (authError) return authError;
    if (error instanceof Error && error.message === "OPENAI_API_KEY_MISSING") {
      return NextResponse.json({ error: "OPENAI_API_KEY is not configured" }, { status: 500 });
    }
    return NextResponse.json({ error: "Failed to generate study plan" }, { status: 500 });
  }
}
