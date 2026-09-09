import mongoose from 'mongoose';
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
    const excludeRatedByUser = req.nextUrl.searchParams.get('excludeRatedByUser');
    const excludeDeniedClips = req.nextUrl.searchParams.get('excludeDeniedClips') === 'true';

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

    // Exclude clips rated by a specific user (Team "Hide Rated" toggle)
    if (excludeRatedByUser && mongoose.Types.ObjectId.isValid(excludeRatedByUser)) {
      const userRatings = await Rating.find({
        $or: [
          { 'ratings.1.userId': excludeRatedByUser },
          { 'ratings.2.userId': excludeRatedByUser },
          { 'ratings.3.userId': excludeRatedByUser },
          { 'ratings.4.userId': excludeRatedByUser },
          { 'ratings.deny.userId': excludeRatedByUser },
        ]
      }).select('clipId').lean();
      const ratedClipIds = userRatings.map((r) => r.clipId);
      if (ratedClipIds.length > 0) {
        filter._id = filter._id
          ? { ...filter._id, $nin: [...(filter._id.$nin || []), ...ratedClipIds] }
          : { $nin: ratedClipIds };
      }
    }

    // Exclude clips with deny count >= threshold (Team "Hide Denied" toggle)
    if (excludeDeniedClips) {
      const adminConfig = await AdminConfig.findOne({}).lean();
      const denyThreshold = adminConfig?.denyThreshold || 5;
      const deniedRatings = await Rating.find({ 'ratings.deny': { $exists: true } }).select('clipId ratings.deny').lean();
      const deniedClipIds = deniedRatings
        .filter((r) => Array.isArray(r.ratings?.deny) && r.ratings.deny.length >= denyThreshold)
        .map((r) => r.clipId);
      if (deniedClipIds.length > 0) {
        filter._id = filter._id
          ? { ...filter._id, $nin: [...(filter._id.$nin || []), ...deniedClipIds] }
          : { $nin: deniedClipIds };
      }
    }

    const sortDir: 1 | -1 = sortOrder === 'asc' ? 1 : -1;
    const complexSortFields = ['ratio', 'averageRating', 'ratingCount', 'denyCount', 'views'];

    const skip = (page - 1) * limit;
    const total = await Clip.countDocuments(filter);

    let clips: any[] = [];

    if (complexSortFields.includes(sortBy)) {
      const pipeline: any[] = [{ $match: filter }];
      const addFields: Record<string, any> = {};

      if (sortBy === 'views') {
        addFields.viewsCount = { $ifNull: ['$views', 0] };
        pipeline.push({ $addFields: addFields });
        pipeline.push({ $sort: { viewsCount: sortDir, createdAt: -1 } });
      } else if (sortBy === 'ratio') {
        addFields.ratio = {
          $cond: {
            if: { $eq: [{ $add: [{ $ifNull: ['$upvotes', 0] }, { $ifNull: ['$downvotes', 0] }] }, 0] },
            then: 0,
            else: {
              $multiply: [
                { $divide: ['$upvotes', { $add: ['$upvotes', '$downvotes'] }] },
                100
              ]
            }
          }
        };
        pipeline.push({ $addFields: addFields });
        pipeline.push({ $sort: { ratio: sortDir, createdAt: -1 } });
      } else {
        pipeline.push({
          $lookup: {
            from: 'ratings',
            localField: '_id',
            foreignField: 'clipId',
            as: 'ratingData'
          }
        });

        if (sortBy === 'ratingCount') {
          addFields.ratingCount = {
            $cond: {
              if: { $eq: [{ $size: '$ratingData' }, 0] },
              then: 0,
              else: {
                $let: {
                  vars: { rating: { $arrayElemAt: ['$ratingData', 0] } },
                  in: {
                    $add: [
                      { $size: { $ifNull: ['$$rating.ratings.1', []] } },
                      { $size: { $ifNull: ['$$rating.ratings.2', []] } },
                      { $size: { $ifNull: ['$$rating.ratings.3', []] } },
                      { $size: { $ifNull: ['$$rating.ratings.4', []] } },
                      { $size: { $ifNull: ['$$rating.ratings.deny', []] } }
                    ]
                  }
                }
              }
            }
          };
          pipeline.push({ $addFields: addFields });
          pipeline.push({ $sort: { ratingCount: sortDir, createdAt: -1 } });
        } else if (sortBy === 'denyCount') {
          addFields.denyCount = {
            $cond: {
              if: { $eq: [{ $size: '$ratingData' }, 0] },
              then: 0,
              else: {
                $let: {
                  vars: { rating: { $arrayElemAt: ['$ratingData', 0] } },
                  in: { $size: { $ifNull: ['$$rating.ratings.deny', []] } }
                }
              }
            }
          };
          pipeline.push({ $addFields: addFields });
          pipeline.push({ $sort: { denyCount: sortDir, createdAt: -1 } });
        } else if (sortBy === 'averageRating') {
          addFields.averageRating = {
            $cond: {
              if: { $eq: [{ $size: '$ratingData' }, 0] },
              then: 0,
              else: {
                $let: {
                  vars: { rating: { $arrayElemAt: ['$ratingData', 0] } },
                  in: {
                    $cond: {
                      if: { $not: { $ifNull: ['$$rating.ratings', false] } },
                      then: 0,
                      else: {
                        $let: {
                          vars: {
                            counts: {
                              r1: { $size: { $ifNull: ['$$rating.ratings.1', []] } },
                              r2: { $size: { $ifNull: ['$$rating.ratings.2', []] } },
                              r3: { $size: { $ifNull: ['$$rating.ratings.3', []] } },
                              r4: { $size: { $ifNull: ['$$rating.ratings.4', []] } }
                            }
                          },
                          in: {
                            $let: {
                              vars: {
                                total: { $add: ['$$counts.r1', '$$counts.r2', '$$counts.r3', '$$counts.r4'] }
                              },
                              in: {
                                $cond: {
                                  if: { $eq: ['$$total', 0] },
                                  then: 0,
                                  else: {
                                    $divide: [
                                      {
                                        $add: [
                                          { $multiply: [1, '$$counts.r1'] },
                                          { $multiply: [2, '$$counts.r2'] },
                                          { $multiply: [3, '$$counts.r3'] },
                                          { $multiply: [4, '$$counts.r4'] }
                                        ]
                                      },
                                      '$$total'
                                    ]
                                  }
                                }
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          };
          pipeline.push({ $addFields: addFields });

          if (sortDir === -1) {
            pipeline.push({
              $addFields: {
                hasRatings: { $cond: [{ $gt: ['$averageRating', 0] }, 1, 0] }
              }
            });
            pipeline.push({ $sort: { hasRatings: -1, averageRating: -1, createdAt: -1 } });
          } else {
            pipeline.push({
              $addFields: {
                hasRatings: { $cond: [{ $gt: ['$averageRating', 0] }, 0, 1] }
              }
            });
            pipeline.push({ $sort: { hasRatings: 0, averageRating: 1, createdAt: -1 } });
          }
        }
      }

      pipeline.push({ $project: { comments: 0, ratingData: 0 } });
      pipeline.push({ $skip: skip }, { $limit: limit });
      clips = await Clip.aggregate(pipeline);
    } else {
      const sortObj: Record<string, any> = {};
      if (sortBy === 'upvotes' || sortBy === 'downvotes') {
        sortObj[sortBy] = sortDir;
        sortObj.createdAt = -1;
      } else if (sortBy === 'createdAt') {
        sortObj.createdAt = sortDir;
      } else {
        sortObj.createdAt = -1;
      }

      clips = await Clip.find(filter)
        .sort(sortObj)
        .skip(skip)
        .limit(limit)
        .select('-comments')
        .lean();
    }

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
