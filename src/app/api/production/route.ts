/* eslint-disable @typescript-eslint/no-explicit-any */
// pages/api/production/index.ts
import { NextRequest, NextResponse } from 'next/server';
import { authenticateUser } from '../../../../middleware/auth';
import { CreateProductionEntryData } from '../../../../types';
import { firebaseService, FirebaseService } from '../../../../lib/firebase-service';

export async function POST(request: NextRequest) {
  try {
    const req = await authenticateUser(request);
    if (!req.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: CreateProductionEntryData = await request.json();
    const entryId = await firebaseService.createProductionEntry({
      ...body,
      created_by: req.user.uid
    });

    return NextResponse.json({ id: entryId }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating production entry:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}