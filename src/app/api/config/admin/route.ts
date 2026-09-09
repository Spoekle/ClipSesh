import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { AdminConfig } from '@/models/configModel';
import { requireAuth } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    const { errorResponse } = requireAuth(req, ['admin', 'clipteam', 'editor']);
    if (errorResponse) return errorResponse;

    let adminConfig = await AdminConfig.findOne().lean();
    if (!adminConfig) {
      const newConfig = new AdminConfig();
      await newConfig.save();
      adminConfig = newConfig.toObject();
    }

    const configObj = adminConfig as Record<string, any>;
    return NextResponse.json({
      ...configObj,
      admin: configObj,
    });
  } catch (error: any) {
    console.error('Error fetching admin config:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    await connectToDatabase();
    const { errorResponse } = requireAuth(req, ['admin']);
    if (errorResponse) return errorResponse;

    const {
      denyThreshold,
      clipChannelIds,
      blacklistedSubmitters,
      blacklistedStreamers,
    } = await req.json();

    let adminConfig = await AdminConfig.findOne();
    if (!adminConfig) {
      adminConfig = new AdminConfig();
    }

    if (denyThreshold !== undefined) adminConfig.denyThreshold = denyThreshold;
    if (clipChannelIds !== undefined) adminConfig.clipChannelIds = clipChannelIds;
    if (blacklistedSubmitters !== undefined)
      adminConfig.blacklistedSubmitters = blacklistedSubmitters;
    if (blacklistedStreamers !== undefined)
      adminConfig.blacklistedStreamers = blacklistedStreamers;

    await adminConfig.save();
    return NextResponse.json(adminConfig);
  } catch (error: any) {
    console.error('Error updating admin config:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
