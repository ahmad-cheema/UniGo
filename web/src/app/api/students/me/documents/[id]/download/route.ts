import { prisma } from "@/lib/prisma";
import { authErrorResponse } from "@/lib/api-errors";
import { requireCurrentUser } from "@/lib/auth/admin";
import { NextRequest, NextResponse } from "next/server";

async function getStudentId() {
  const user = await requireCurrentUser();
  if (!user.studentProfile) throw new Error("NO_PROFILE");
  return user.studentProfile.id;
}

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const studentId = await getStudentId();
    const { id } = await context.params;
    const documentId = Number(id);
    if (!Number.isFinite(documentId)) {
      return NextResponse.json({ error: "Invalid document id" }, { status: 400 });
    }

    const document = await prisma.academicDocument.findFirst({
      where: { id: documentId, studentId },
    });
    if (!document) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    return new NextResponse(document.data, {
      headers: {
        "Content-Type": document.mimeType,
        "Content-Disposition": `attachment; filename="${document.fileName.replace(/"/g, "")}"`,
      },
    });
  } catch (error) {
    const authError = authErrorResponse(error);
    if (authError) return authError;
    return NextResponse.json({ error: "Failed to download document" }, { status: 500 });
  }
}
