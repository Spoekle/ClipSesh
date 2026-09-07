import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { PublicConfig, AdminConfig } from '@/models/configModel';
import { requireAuth } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    const { errorResponse } = requireAuth(req, ['admin', 'clipteam', 'editor']);
    if (errorResponse) return errorResponse;

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
  } catch (error: any) {
    console.error('Error fetching combined config:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
