/* eslint-disable @typescript-eslint/no-explicit-any */
// middleware/permission.ts
import { NextRequest, NextResponse } from 'next/server';
import { Permission } from '../types';

export function requirePermission(requiredPermission: Permission) {
  return function (request: NextRequest) {
    const req = request as any;
    if (!req.user || !req.user.permissions.includes(requiredPermission)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    return req;
  };
}