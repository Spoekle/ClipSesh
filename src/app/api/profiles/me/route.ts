import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import User from '@/models/userModel';
import Clip from '@/models/clipModel';
import { requireAuth } from '@/lib/auth';

function isValidUrl(url: string) {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();
    const { user: authUser, errorResponse } = requireAuth(req);
    if (errorResponse) return errorResponse;

    const userId = authUser!.id;
    const user = await User.findById(userId).select('-password').lean();

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    let clipsSubmitted = 0;
    if (user.discordId) {
      clipsSubmitted = await Clip.countDocuments({
        discordSubmitterId: user.discordId,
        archived: { $ne: true },
      });
    }

    await User.findByIdAndUpdate(userId, { 'profile.lastActive': new Date() });

    const userWithStats = {
      ...user,
      stats: {
        clipsSubmitted,
        joinDate: user.createdAt,
      },
    };

    return NextResponse.json({
      success: true,
      profile: userWithStats,
    });
  } catch (error: any) {
    console.error('Error fetching user profile:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    await connectToDatabase();
    const { user: authUser, errorResponse } = requireAuth(req);
    if (errorResponse) return errorResponse;

    const userId = authUser!.id;
    const { bio, website, socialLinks, vrheadset, isPublic } = await req.json();

    if (website && !isValidUrl(website)) {
      return NextResponse.json({ error: 'Invalid website URL' }, { status: 400 });
    }

    if (socialLinks) {
      for (const [platform, url] of Object.entries(socialLinks)) {
        if (url && typeof url === 'string' && !isValidUrl(url)) {
          return NextResponse.json(
            { error: `Invalid URL for ${platform}` },
            { status: 400 }
          );
        }
      }
    }

    const updateData: Record<string, any> = {
      'profile.bio': bio || '',
      'profile.website': website || '',
      'profile.socialLinks': socialLinks || {},
      'profile.vrheadset': vrheadset || 'Other',
      'profile.isPublic': Boolean(isPublic),
      'profile.lastActive': new Date(),
    };

    const updatedUser = await User.findByIdAndUpdate(userId, updateData, {
      new: true,
    }).select('-password');

    if (!updatedUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    let clipsSubmitted = 0;
    if (updatedUser.discordId) {
      clipsSubmitted = await Clip.countDocuments({
        discordSubmitterId: updatedUser.discordId,
        archived: { $ne: true },
      });
    }

    const userWithStats = {
      ...updatedUser.toObject(),
      stats: {
        clipsSubmitted,
        joinDate: updatedUser.createdAt,
      },
    };

    return NextResponse.json({
      success: true,
      message: 'Profile updated successfully',
      profile: userWithStats,
    });
  } catch (error: any) {
    console.error('Error updating profile:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
