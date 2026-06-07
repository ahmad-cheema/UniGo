import { prisma } from "@/lib/prisma";
import { authErrorResponse } from "@/lib/api-errors";
import { requireCurrentUser } from "@/lib/auth/admin";
import { NextRequest, NextResponse } from "next/server";

async function getStudentId() {
  const user = await requireCurrentUser();
  if (!user.studentProfile) throw new Error("NO_PROFILE");
  return user.studentProfile.id;
}

export async function DELETE(
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

    await prisma.academicDocument.deleteMany({
      where: { id: documentId, studentId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    const authError = authErrorResponse(error);
    if (authError) return authError;
    return NextResponse.json({ error: "Failed to delete document" }, { status: 500 });
  }
}
