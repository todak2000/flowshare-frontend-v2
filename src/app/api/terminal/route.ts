/* eslint-disable @typescript-eslint/no-explicit-any */
// pages/api/terminal/index.ts
import { NextRequest, NextResponse } from 'next/server';
import { authenticateUser } from '../../../../middleware/auth';
import { CreateTerminalReceiptData } from '../../../../types';
import { FirebaseService } from '../../../../lib/firebase-service';

export async function POST(request: NextRequest) {
  try {
    const req = await authenticateUser(request);
    if (!req.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: CreateTerminalReceiptData = await request.json();
    const firebaseService = new FirebaseService();
    const receiptId = await firebaseService.createTerminalReceipt({
      ...body,
      created_by: req.user.uid
    });

    return NextResponse.json({ id: receiptId }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating terminal receipt:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}