import { NextRequest } from 'next/server';
import { GET as getHandler, PUT as putHandler } from '@/app/api/config/admin/route';

export async function GET(req: NextRequest) {
  return getHandler(req);
}

export async function PUT(req: NextRequest) {
  return putHandler(req);
}
