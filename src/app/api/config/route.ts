import { NextResponse } from 'next/server';
import { authRoute } from '@/lib/route';
import { PublicConfig, AdminConfig } from '@/models/configModel';

export const GET = authRoute(['admin', 'clipteam', 'editor'], async (req) => {
  let [publicConfig, adminConfig] = await Promise.all([
    PublicConfig.findOne(),
    AdminConfig.findOne(),
  ]);

  if (!publicConfig) {
    publicConfig = new PublicConfig();
    await publicConfig.save();
  }
  if (!adminConfig) {
    adminConfig = new AdminConfig();
    await adminConfig.save();
  }

  return NextResponse.json({
    public: publicConfig,
    admin: adminConfig,
  });
});
