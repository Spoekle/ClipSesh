import { NextResponse } from 'next/server';
import { authRoute } from '@/lib/route';
import { getAdminConfig, getPublicConfig } from '@/db/queries';

export const GET = authRoute(['admin', 'clipteam', 'editor'], async () => {
  const [publicConfig, adminConfig] = await Promise.all([getPublicConfig(), getAdminConfig()]);

  return NextResponse.json({
    public: publicConfig,
    admin: adminConfig,
  });
});
