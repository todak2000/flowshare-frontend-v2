/* eslint-disable @typescript-eslint/no-explicit-any */
// pages/api/reconcile/index.ts
import { NextRequest, NextResponse } from "next/server";
import { authenticateUser } from "../../../../middleware/auth";
import { FirebaseService } from "../../../../lib/firebase-service";

export async function POST(request: NextRequest) {
  try {
    const req = await authenticateUser(request);
    if (!req.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { date } = body;

    if (!date) {
      return NextResponse.json({ error: "Date is required" }, { status: 400 });
    }

    const firebaseService = new FirebaseService();
    const reconciliationId = await firebaseService.triggerReconciliation(
      new Date(date),
      req.user.uid
    );

    return NextResponse.json({ id: reconciliationId }, { status: 201 });
  } catch (error: any) {
    console.error("Error triggering reconciliation:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
