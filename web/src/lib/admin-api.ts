import { authErrorResponse } from "@/lib/api-errors";
import { requireAdmin } from "@/lib/auth/admin";
import { NextResponse } from "next/server";

export async function withAdmin<T>(handler: () => Promise<T>) {
  try {
    await requireAdmin();
    return await handler();
  } catch (error) {
    const authError = authErrorResponse(error);
    if (authError) return authError;
    return NextResponse.json({ error: "Admin request failed" }, { status: 500 });
  }
}
