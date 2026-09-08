import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Clip from '@/models/clipModel';
import ClipView from '@/models/clipViewModel';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase();
    const { id } = await params;

    const clip = await Clip.findById(id);
    if (!clip) {
      return NextResponse.json({ error: 'Clip not found' }, { status: 404 });
    }

    // Extract client IP address
    const forwarded = req.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0].trim() : req.headers.get('x-real-ip') || '127.0.0.1';

    // Check if this IP has viewed this clip within the cooldown window (TTL is 2 hours)
    const existingView = await ClipView.findOne({ clipId: id, ip });
    if (existingView) {
      return NextResponse.json({
        success: true,
        views: clip.views || 0,
        counted: false,
      });
    }

    // Record the view and increment the clip's view counter atomically
    await ClipView.create({ clipId: id, ip });
    const updatedClip = await Clip.findByIdAndUpdate(
      id,
      { $inc: { views: 1 } },
      { new: true }
    );

    return NextResponse.json({
      success: true,
      views: updatedClip?.views || 1,
      counted: true,
    });
  } catch (error) {
    console.error('Error recording clip view:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
