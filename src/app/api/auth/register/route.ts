/* eslint-disable @typescript-eslint/no-explicit-any */
// pages/api/auth/register.ts
import { NextRequest, NextResponse } from "next/server";
import { FirebaseService } from "../../../../../lib/firebase-service";

// Use Firebase Auth REST API for registration
export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { message: "Email and password are required" },
        { status: 400 }
      );
    }

    // ✅ Optionally, store user in Firestore using Firebase Admin SDK
    const firebaseService = new FirebaseService();
    const res = await firebaseService.createUserInFirestore({
      email,
      password,
      role: "field_operator",
      company: "Default Company",
      permissions: ["view_production_data", "create_production_entry"],
      active: true,
    });

    return NextResponse.json(res, { status: 201 });
  } catch (error: any) {
    console.error("Registration error:", error.message);
    return NextResponse.json(
      { message: error.message || "Registration failed" },
      { status: 400 }
    );
  }
}
