import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';
import ffmpeg from 'fluent-ffmpeg';
import { and, asc, count, desc, eq, notInArray, or, sql, type AnyColumn, type SQL } from 'drizzle-orm';
import { apiRoute, authRoute } from '@/lib/route';
import { db } from '@/lib/db';
import { clipRatings, clips } from '@/db/schema';
import {
  getAdminConfig,
  getRatingDocs,
  ilikeContains,
  refreshClipCount,
  type RatingDoc,
} from '@/db/queries';
import { getCurrentSeason, parseSeason, requireSeason } from '@/lib/seasonHelpers';
import { getClipPath } from '@/lib/seasonPathHelpers';
import { isValidId } from '@/lib/ids';

const ratingCount = sql<number>`(select count(*) from ${clipRatings} where ${clipRatings.clipId} = ${clips._id})`;
const denyCount = sql<number>`(select count(*) from ${clipRatings} where ${clipRatings.clipId} = ${clips._id} and ${clipRatings.rating} = 'deny')`;
const averageRating = sql<number>`coalesce((select avg(${clipRatings.rating}::text::int) from ${clipRatings} where ${clipRatings.clipId} = ${clips._id} and ${clipRatings.rating} <> 'deny'), 0)`;
const upvoteRatio = sql<number>`case when ${clips.upvotes} + ${clips.downvotes} = 0 then 0 else ${clips.upvotes} * 100.0 / (${clips.upvotes} + ${clips.downvotes}) end`;

function buildOrderBy(sortBy: string, ascending: boolean): SQL[] {
  const dir = (value: SQL | AnyColumn) => (ascending ? asc(value) : desc(value));
  const newestFirst = desc(clips.createdAt);

  switch (sortBy) {
    case 'views':
      return [dir(clips.views), newestFirst];
    case 'ratio':
      return [dir(upvoteRatio), newestFirst];
    case 'ratingCount':
      return [dir(ratingCount), newestFirst];
    case 'denyCount':
      return [dir(denyCount), newestFirst];
    case 'averageRating':
      // Rated clips always come before unrated ones, whichever direction is chosen.
      return [desc(sql`${averageRating} > 0`), dir(averageRating), newestFirst];
    case 'upvotes':
      return [dir(clips.upvotes), newestFirst];
    case 'downvotes':
      return [dir(clips.downvotes), newestFirst];
    case 'createdAt':
      return [dir(clips.createdAt)];
    default:
      return [newestFirst];
  }
}

export const GET = apiRoute(async (req) => {
  const searchParams = req.nextUrl.searchParams;
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1);
  const limit = Math.max(1, parseInt(searchParams.get('limit') || '12', 10) || 12);
  const sortBy = searchParams.get('sortBy') || 'createdAt';
  const sortOrder = searchParams.get('sortOrder') || 'desc';
  const streamer = searchParams.get('streamer');
  const search = searchParams.get('search');
  const season = searchParams.get('season');
  const year = searchParams.get('year');
  const includeRatings = searchParams.get('includeRatings') === 'true';
  const archived = searchParams.get('archived');
  const excludeRatedByUser = searchParams.get('excludeRatedByUser');
  const excludeDeniedClips = searchParams.get('excludeDeniedClips') === 'true';

  const conditions: Array<SQL | undefined> = [];

  if (archived === 'true') {
    conditions.push(eq(clips.archived, true));
  } else if (archived === 'all' || ((season || year) && archived !== 'false')) {
    // When viewing an archive season/year or requesting 'all', do not restrict by archived
  } else {
    conditions.push(eq(clips.archived, false));
  }

  if (streamer) {
    conditions.push(ilikeContains(clips.streamer, streamer));
  }
  if (season) {
    const seasonName = parseSeason(season);
    // An unknown season matches nothing, like the old exact-match filter.
    conditions.push(seasonName ? eq(clips.season, seasonName) : sql`false`);
  }
  if (year) {
    conditions.push(eq(clips.year, parseInt(year, 10)));
  }
  if (search) {
    conditions.push(
      or(
        ilikeContains(clips.title, search),
        ilikeContains(clips.streamer, search),
        ilikeContains(clips.submitter, search)
      )
    );
  }

  // Exclude clips rated by a specific user (Team "Hide Rated" toggle)
  if (excludeRatedByUser && isValidId(excludeRatedByUser)) {
    conditions.push(
      notInArray(
        clips._id,
        db
          .select({ clipId: clipRatings.clipId })
          .from(clipRatings)
          .where(eq(clipRatings.userId, excludeRatedByUser))
      )
    );
  }

  // Exclude clips with deny count >= threshold (Team "Hide Denied" toggle)
  if (excludeDeniedClips) {
    const { denyThreshold } = await getAdminConfig();
    conditions.push(
      notInArray(
        clips._id,
        db
          .select({ clipId: clipRatings.clipId })
          .from(clipRatings)
          .where(eq(clipRatings.rating, 'deny'))
          .groupBy(clipRatings.clipId)
          .having(sql`count(*) >= ${Math.max(1, denyThreshold || 5)}`)
      )
    );
  }

  const where = and(...conditions);
  const [rows, [{ total }]] = await Promise.all([
    db
      .select()
      .from(clips)
      .where(where)
      .orderBy(...buildOrderBy(sortBy, sortOrder === 'asc'))
      .limit(limit)
      .offset((page - 1) * limit),
    db.select({ total: count() }).from(clips).where(where),
  ]);

  const ratingsData: Record<string, RatingDoc> = {};
  if (includeRatings && rows.length > 0) {
    const docs = await getRatingDocs(rows.map((c) => c._id));
    for (const [clipId, doc] of docs) {
      ratingsData[clipId] = doc;
    }
  }

  return NextResponse.json({
    clips: rows,
    ratings: ratingsData,
    total,
    page,
    pages: Math.ceil(total / limit),
  });
});

function formString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === 'string' ? value : '';
}

export const POST = authRoute(['uploader', 'admin'], async (req) => {
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
    streamer = formString(formData, 'streamer');
    submitter = formString(formData, 'submitter');
    title = formString(formData, 'title');
    link = formString(formData, 'link');
    discordSubmitterId = formString(formData, 'discordSubmitterId') || undefined;
    const clipFile = formData.get('clip');
    file = clipFile instanceof File ? clipFile : null;
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

  const [newClip] = await db
    .insert(clips)
    .values({
      url: fileUrl,
      thumbnail: thumbnailUrl || null,
      streamer,
      submitter,
      title: title || 'Untitled Clip',
      link: link || null,
      discordSubmitterId,
      season: requireSeason(season),
      year,
    })
    .returning();
  await refreshClipCount();

  return NextResponse.json({ success: true, clip: newClip });
});
