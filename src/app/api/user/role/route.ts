// pages/api/user/role.ts
import { NextRequest } from 'next/server';
import { authenticateUser } from '../../../../../middleware/auth';

export async function GET(request: NextRequest) {
  const req = await authenticateUser(request);
  if (!req.user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }
  return new Response(JSON.stringify({ role: req.user.role }), { status: 200 });
}