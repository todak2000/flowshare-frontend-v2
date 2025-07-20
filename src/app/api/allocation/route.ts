/* eslint-disable @typescript-eslint/no-explicit-any */
// pages/api/allocation/index.ts
import { NextRequest, NextResponse } from 'next/server';
import { authenticateUser } from '../../../../middleware/auth';
import { FirebaseService } from '../../../../lib/firebase-service';

export async function GET(request: NextRequest) {
    
  try {
    const req = await authenticateUser(request);
    if (!req.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const partnerId = searchParams.get('partnerId');

    const firebaseService = new FirebaseService();
    const results = await firebaseService.getAllocationResults(partnerId as string);

    return NextResponse.json(results, { status: 200 });
  } catch (error: any) {
    console.error('Error fetching allocation results:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}