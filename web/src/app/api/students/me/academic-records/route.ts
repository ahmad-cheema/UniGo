import { prisma } from "@/lib/prisma";
import { authErrorResponse } from "@/lib/api-errors";
import { requireCurrentUser } from "@/lib/auth/admin";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const MAX_DOCUMENT_BYTES = 2 * 1024 * 1024;
const ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
]);

const recordSchema = z.object({
  level: z.string().min(2),
  subject: z.string().min(2),
  marksObtained: z.number().min(0).nullable().optional(),
  totalMarks: z.number().positive().nullable().optional(),
  grade: z.string().nullable().optional(),
  percentage: z.number().min(0).max(100).nullable().optional(),
  examBoard: z.string().nullable().optional(),
  examYear: z.number().int().min(1950).max(2100).nullable().optional(),
});

function inferPercentage(
  percentage?: number | null,
  marksObtained?: number | null,
  totalMarks?: number | null
) {
  if (typeof percentage === "number") return percentage;
  if (typeof marksObtained === "number" && typeof totalMarks === "number" && totalMarks > 0) {
    return Number(((marksObtained / totalMarks) * 100).toFixed(2));
  }
  return null;
}

async function getStudentId() {
  const user = await requireCurrentUser();
  if (!user.studentProfile) {
    throw new Error("NO_PROFILE");
  }
  return user.studentProfile.id;
}

export async function GET() {
  try {
    const studentId = await getStudentId();
    const [records, documents] = await Promise.all([
      prisma.academicRecord.findMany({
        where: { studentId },
        orderBy: [{ level: "asc" }, { subject: "asc" }],
      }),
      prisma.academicDocument.findMany({
        where: { studentId },
        select: {
          id: true,
          title: true,
          level: true,
          fileName: true,
          mimeType: true,
          sizeBytes: true,
          uploadedAt: true,
        },
        orderBy: { uploadedAt: "desc" },
      }),
    ]);

    return NextResponse.json({ records, documents });
  } catch (error) {
    const authError = authErrorResponse(error);
    if (authError) return authError;
    if (error instanceof Error && error.message === "NO_PROFILE") {
      return NextResponse.json({ error: "No student profile" }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to load academic records" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const studentId = await getStudentId();
    const contentType = req.headers.get("content-type") ?? "";

    if (contentType.includes("multipart/form-data")) {
      const form = await req.formData();
      const file = form.get("file");
      if (!(file instanceof File)) {
        return NextResponse.json({ error: "File is required" }, { status: 400 });
      }
      if (!ALLOWED_MIME_TYPES.has(file.type)) {
        return NextResponse.json({ error: "Only PDF, JPG, PNG, and WEBP files are allowed" }, { status: 400 });
      }
      if (file.size > MAX_DOCUMENT_BYTES) {
        return NextResponse.json({ error: "Document must be 2 MB or smaller" }, { status: 400 });
      }

      const bytes = Buffer.from(await file.arrayBuffer());
      const document = await prisma.academicDocument.create({
        data: {
          studentId,
          title: String(form.get("title") || file.name),
          level: String(form.get("level") || "") || null,
          fileName: file.name,
          mimeType: file.type,
          sizeBytes: file.size,
          data: bytes,
        },
        select: {
          id: true,
          title: true,
          level: true,
          fileName: true,
          mimeType: true,
          sizeBytes: true,
          uploadedAt: true,
        },
      });

      return NextResponse.json(document, { status: 201 });
    }

    const body = await req.json();
    const parsed = recordSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const record = await prisma.academicRecord.create({
      data: {
        ...parsed.data,
        percentage: inferPercentage(
          parsed.data.percentage,
          parsed.data.marksObtained,
          parsed.data.totalMarks
        ),
        studentId,
      },
    });

    return NextResponse.json(record, { status: 201 });
  } catch (error) {
    const authError = authErrorResponse(error);
    if (authError) return authError;
    if (error instanceof Error && error.message === "NO_PROFILE") {
      return NextResponse.json({ error: "No student profile" }, { status: 400 });
    }
    return NextResponse.json({ error: "Failed to save academic data" }, { status: 500 });
  }
}
