import { NextResponse } from 'next/server';
import { authRoute } from '@/lib/route';
import { getAdminConfig } from '@/db/queries';

export const GET = authRoute(['admin'], async () => {
  const { blacklistedSubmitters, blacklistedStreamers } = await getAdminConfig();

  return NextResponse.json({
    blacklistedSubmitters: blacklistedSubmitters.map((submitter) => ({
      id: submitter.userId,
      username: submitter.username,
    })),
    blacklistedStreamers,
  });
});
