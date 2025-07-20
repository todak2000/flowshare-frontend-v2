/* eslint-disable @typescript-eslint/no-explicit-any */
// middleware/auth.ts
import { NextRequest, NextResponse } from 'next/server';
import { UserRole, Permission } from '../types';
import { adminAuth } from '../lib/firebase-admin';
import { FirebaseService } from '../lib/firebase-service';

export interface AuthenticatedRequest extends NextRequest {
  user?: {
    uid: string;
    email: string;
    role: UserRole;
    permissions: Permission[];
    company: string;
  };
}

/**
 * Middleware to authenticate Firebase user via JWT in Authorization header
 */
export async function authenticateUser(request: NextRequest): Promise<AuthenticatedRequest> {
  const authHeader = request.headers.get('Authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    const error = new Error('Unauthorized: Missing or invalid token');
    return unauthorizedResponse(request, error);
  }

  const idToken = authHeader.split('Bearer ')[1];

  try {
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    const firebaseService = new FirebaseService();

    // Get user from Firebase
    const userDoc: any = await firebaseService.getUserById(decodedToken.uid);
    if (!userDoc || !userDoc.active) {
      const error = new Error('Unauthorized: User not found or inactive');
      return unauthorizedResponse(request, error);
    }

    // Attach user to request
    (request as AuthenticatedRequest).user = {
      uid: userDoc.uid,
      email: userDoc.email,
      role: userDoc.role,
      permissions: userDoc.permissions,
      company: userDoc.company
    };

    return request as AuthenticatedRequest;
  } catch (error: any) {
    console.error('Authentication error:', error.message);
    return unauthorizedResponse(request, error);
  }
}

function unauthorizedResponse(req: NextRequest, error: Error): AuthenticatedRequest {
  const unauthorizedReq = req as AuthenticatedRequest;
  unauthorizedReq.user = undefined;
  return unauthorizedReq;
}