import { NextResponse } from 'next/server';
import { authRoute } from '@/lib/route';
import { AdminConfig } from '@/models/configModel';

export const GET = authRoute(['admin'], async (req) => {
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
});
