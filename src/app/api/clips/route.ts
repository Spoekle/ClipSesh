import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';
import ffmpeg from 'fluent-ffmpeg';
import { connectToDatabase } from '@/lib/db';
import Clip from '@/models/clipModel';
import Rating from '@/models/ratingModel';
import { PublicConfig, AdminConfig } from '@/models/configModel';
import { requireAuth } from '@/lib/auth';
import { getCurrentSeason, getClipPath } from '@/lib/seasonHelpers';

async function updateClipCount(): Promise<number> {
  try {
    const count = await Clip.countDocuments({ archived: { $ne: true } });
    await PublicConfig.findOneAndUpdate(
      {},
      { clipAmount: count },
      { upsert: true, new: true }
    );
    return count;
  } catch {
    return 0;
  }
}

export async function GET(req: NextRequest) {
  try {
    await connectToDatabase();

    const page = parseInt(req.nextUrl.searchParams.get('page') || '1', 10);
    const limit = parseInt(req.nextUrl.searchParams.get('limit') || '12', 10);
    const sortBy = req.nextUrl.searchParams.get('sortBy') || 'createdAt';
    const sortOrder = req.nextUrl.searchParams.get('sortOrder') || 'desc';
    const streamer = req.nextUrl.searchParams.get('streamer');
    const search = req.nextUrl.searchParams.get('search');
    const season = req.nextUrl.searchParams.get('season');
    const year = req.nextUrl.searchParams.get('year');
    const includeRatings = req.nextUrl.searchParams.get('includeRatings') === 'true';
    const archived = req.nextUrl.searchParams.get('archived');

    const filter: Record<string, any> = {};

    if (archived === 'true') {
      filter.archived = true;
    } else if (archived === 'false') {
      filter.archived = { $ne: true };
    } else if (archived === 'all' || season || year) {
      // When viewing an archive season/year or requesting 'all', do not restrict by archived
    } else {
      filter.archived = { $ne: true };
    }

    if (streamer) {
      filter.streamer = { $regex: streamer, $options: 'i' };
    }
    if (season) {
      filter.season = { $regex: new RegExp(`^${season}$`, 'i') };
    }
    if (year) {
      filter.year = parseInt(year, 10);
    }
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { streamer: { $regex: search, $options: 'i' } },
        { submitter: { $regex: search, $options: 'i' } },
      ];
    }

    const sortDir = sortOrder === 'asc' ? 1 : -1;
    const sortObj: Record<string, any> = {};

    if (sortBy === 'upvotes' || sortBy === 'downvotes' || sortBy === 'createdAt' || sortBy === 'views') {
      sortObj[sortBy] = sortDir;
    } else {
      sortObj['createdAt'] = -1;
    }

    const skip = (page - 1) * limit;

    const [clips, total] = await Promise.all([
      Clip.find(filter)
        .sort(sortObj)
        .skip(skip)
        .limit(limit)
        .select('-comments')
        .lean(),
      Clip.countDocuments(filter),
    ]);

    let ratingsData: Record<string, any> = {};
    if (includeRatings && clips.length > 0) {
      const clipIds = clips.map((c) => c._id);
      const ratings = await Rating.find({ clipId: { $in: clipIds } }).lean();
      ratings.forEach((r) => {
        ratingsData[r.clipId.toString()] = r;
      });
    }

    return NextResponse.json({
      clips,
      ratings: ratingsData,
      total,
      page,
      pages: Math.ceil(total / limit),
    });
  } catch (error: any) {
    console.error('Error fetching clips:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const { errorResponse } = requireAuth(req, ['uploader', 'admin']);
    if (errorResponse) return errorResponse;

    const contentType = req.headers.get('content-type') || '';
    let streamer = '';
    let submitter = '';
    let title = '';
    let link = '';
    let discordSubmitterId: string | undefined = undefined;
    let file: File | null = null;

    if (contentType.includes('application/json')) {
      const json = await req.json();
      streamer = json.streamer || '';
      submitter = json.submitter || '';
      title = json.title || '';
      link = json.link || '';
      discordSubmitterId = json.discordSubmitterId;
    } else {
      const formData = await req.formData();
      streamer = (formData.get('streamer') as string) || '';
      submitter = (formData.get('submitter') as string) || '';
      title = (formData.get('title') as string) || '';
      link = (formData.get('link') as string) || '';
      discordSubmitterId = (formData.get('discordSubmitterId') as string) || undefined;
      file = formData.get('clip') as File | null;
    }

    if (!streamer || !submitter || (!file && !link)) {
      return NextResponse.json(
        { error: 'Missing required fields (streamer, submitter, and clip or link)' },
        { status: 400 }
      );
    }

    const uploadsBaseDir = path.join(process.cwd(), 'uploads');
    await fs.promises.mkdir(uploadsBaseDir, { recursive: true });

    let fileUrl = '';
    let thumbnailUrl = '';
    const uploadDate = new Date();

    if (file) {
      const timestamp = Date.now();
      const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const filename = `${timestamp}-${sanitizedName}`;

      const { fullPath, relativePath, directory } = getClipPath(uploadsBaseDir, filename, uploadDate);
      const bytes = await file.arrayBuffer();
      await fs.promises.writeFile(fullPath, Buffer.from(bytes));

      fileUrl = `/uploads/${relativePath.replace(/\\/g, '/')}`;

      // Generate thumbnail using ffmpeg
      const thumbnailFilename = `${path.parse(filename).name}_thumbnail.png`;
      const thumbnailPath = path.join(directory, thumbnailFilename);
      const thumbRelative = path.relative(uploadsBaseDir, thumbnailPath);

      try {
        await new Promise<void>((resolve, reject) => {
          ffmpeg(fullPath)
            .screenshots({
              timestamps: ['00:00:00.001'],
              filename: thumbnailFilename,
              folder: directory,
              size: '640x360',
            })
            .on('end', () => resolve())
            .on('error', (err) => reject(err));
        });
        thumbnailUrl = `/uploads/${thumbRelative.replace(/\\/g, '/')}`;
      } catch (thumbErr) {
        console.warn('Could not generate video thumbnail with ffmpeg:', thumbErr);
      }
    } else if (link) {
      fileUrl = link;
    }

    const { season, year } = getCurrentSeason(uploadDate);
    const capitalizedSeason = (season.charAt(0).toUpperCase() + season.slice(1)) as any;

    const newClip = new Clip({
      url: fileUrl,
      thumbnail: thumbnailUrl || undefined,
      streamer,
      submitter,
      title: title || 'Untitled Clip',
      link: link || undefined,
      discordSubmitterId,
      season: capitalizedSeason,
      year,
    });

    await newClip.save();
    await updateClipCount();

    return NextResponse.json({ success: true, clip: newClip });
  } catch (error: any) {
    console.error('Error uploading clip:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
