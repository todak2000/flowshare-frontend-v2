/* eslint-disable @typescript-eslint/no-explicit-any */
// pages/api/auth/login.ts
import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "../../../../../lib/firebase-admin";
import { getFirestore, doc, getDoc } from "firebase/firestore"; // Your Firebase Web SDK app
import { User } from "../../../../../types";
import app from "../../../../../lib/firebase";

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { message: "Email and password are required" },
        { status: 400 }
      );
    }

    // 🔐 Step 1: Sign in with Firebase Auth REST API
    const FIREBASE_API_KEY = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
    const identityResponse = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts :signInWithPassword?key=${FIREBASE_API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
          returnSecureToken: true,
        }),
      }
    );

    const identityData = await identityResponse.json();

    if (!identityResponse.ok) {
      throw new Error(identityData.error?.message || "Authentication failed");
    }

    const { localId, idToken } = identityData;

    // 🔐 Step 2: Get user data from Firestore
    const db = getFirestore(app);
    const userDocRef = doc(db, "users", localId);
    const userDoc = await getDoc(userDocRef);

    if (!userDoc.exists()) {
      throw new Error("User data not found in Firestore");
    }

    const userData = userDoc.data() as User;

    // ✅ Step 3: Generate Firebase custom token with role in claims
    const customToken = await adminAuth.createCustomToken(localId, {
      role: userData.role,
      company: userData.company,
      permissions: userData.permissions,
    });

    // ✅ Step 4: Return token + user metadata
    return NextResponse.json(
      {
        token: customToken, // Send this to the client to use in future requests
        userId: localId,
        email: identityData.email,
        role: userData.role,
        company: userData.company,
        permissions: userData.permissions,
        idToken, // Optional: raw Firebase ID token
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Login error:", error.message);
    return NextResponse.json(
      { message: error.message || "Authentication failed" },
      { status: 401 }
    );
  }
}
