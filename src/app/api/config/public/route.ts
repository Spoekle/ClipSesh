import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { PublicConfig } from '@/models/configModel';
import Clip from '@/models/clipModel';
import { requireAuth } from '@/lib/auth';

export async function GET() {
  try {
    await connectToDatabase();

    let publicConfig = await PublicConfig.findOne();
    if (!publicConfig) {
      publicConfig = new PublicConfig();
      await publicConfig.save();
    }

    if (publicConfig.clipAmount === undefined || publicConfig.clipAmount === 0) {
      const count = await Clip.countDocuments({ archived: { $ne: true } });
      publicConfig.clipAmount = count;
      await publicConfig.save();
    }

    return NextResponse.json(publicConfig);
  } catch (error: any) {
    console.error('Error fetching public config:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    await connectToDatabase();
    const { errorResponse } = requireAuth(req, ['admin']);
    if (errorResponse) return errorResponse;

    const { latestVideoLink } = await req.json();

    let publicConfig = await PublicConfig.findOne();
    if (!publicConfig) {
      publicConfig = new PublicConfig();
    }

    publicConfig.latestVideoLink = latestVideoLink || '';
    await publicConfig.save();

    return NextResponse.json(publicConfig);
  } catch (error: any) {
    console.error('Error updating public config:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
