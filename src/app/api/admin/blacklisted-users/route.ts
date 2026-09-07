import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { AdminConfig } from '@/models/configModel';
import { requireAuth } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    const { errorResponse } = requireAuth(req, ['admin']);
    if (errorResponse) return errorResponse;

    const adminConfig = await AdminConfig.findOne();
    const blacklistedSubmitters = adminConfig?.blacklistedSubmitters || [];
    const blacklistedStreamers = adminConfig?.blacklistedStreamers || [];

    const blacklistedSubmittersInfo = blacklistedSubmitters.map((submitter: any) => ({
      id: submitter.userId,
      username: submitter.username,
      discriminator: submitter.discriminator,
      global_name: submitter.global_name,
      avatar: submitter.avatar,
    }));

    return NextResponse.json({
      blacklistedSubmitters: blacklistedSubmittersInfo,
      blacklistedStreamers,
    });
  } catch (error: any) {
    console.error('Error fetching blacklisted users:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
