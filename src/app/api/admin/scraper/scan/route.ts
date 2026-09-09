import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { startChannelScan } from '@/lib/discordScraper';

export async function POST(req: NextRequest) {
  try {
    const { errorResponse } = requireAuth(req, ['admin']);
    if (errorResponse) return errorResponse;

    const body = await req.json().catch(() => ({}));
    const { channelId } = body;

    if (!channelId || typeof channelId !== 'string' || !channelId.trim()) {
      return NextResponse.json(
        { error: 'channelId is required (must be a valid Discord channel ID string)' },
        { status: 400 }
      );
    }

    const token = process.env.DISCORD_BOT_TOKEN;
    if (!token || token.trim() === '') {
      return NextResponse.json(
        {
          error:
            'DISCORD_BOT_TOKEN is not configured in server environment (.env). Please add your Discord bot token to enable channel scraping.',
        },
        { status: 500 }
      );
    }

    const job = startChannelScan(channelId.trim(), token.trim());

    return NextResponse.json({
      success: true,
      jobId: job.jobId,
      status: job.status,
      message: 'Channel scan started',
    });
  } catch (error: any) {
    console.error('Error starting channel scan:', error);
    return NextResponse.json(
      { error: error?.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
