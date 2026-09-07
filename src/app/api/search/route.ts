import { NextRequest, NextResponse } from 'next/server';
import Fuse from 'fuse.js';
import { connectToDatabase } from '@/lib/db';
import Clip from '@/models/clipModel';
import User from '@/models/userModel';
import { getCurrentSeason } from '@/lib/seasonHelpers';

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q') || req.nextUrl.searchParams.get('query');
  const type = req.nextUrl.searchParams.get('type') || 'all';
  const season = req.nextUrl.searchParams.get('season');
  const yearStr = req.nextUrl.searchParams.get('year');
  const pageStr = req.nextUrl.searchParams.get('page') || '1';
  const limitStr = req.nextUrl.searchParams.get('limit') || '12';
  const sort = req.nextUrl.searchParams.get('sort') || 'newest';
  const streamer = req.nextUrl.searchParams.get('streamer');
  const submitter = req.nextUrl.searchParams.get('submitter');

  if (!q || q.trim() === '') {
    return NextResponse.json(
      { error: 'Missing search query parameter `q` or `query`.' },
      { status: 400 }
    );
  }

  const page = parseInt(pageStr, 10) || 1;
  const limit = parseInt(limitStr, 10) || 12;
  const year = yearStr ? parseInt(yearStr, 10) : null;
  const skip = (page - 1) * limit;

  try {
    await connectToDatabase();
    const currentSeason = getCurrentSeason();

    const results: any = {
      clips: [],
      profiles: [],
      currentSeasonClips: [],
      otherSeasonsClips: {},
      availableSeasons: [],
      currentSeason: {
        season: currentSeason.season.charAt(0).toUpperCase() + currentSeason.season.slice(1),
        year: currentSeason.year,
      },
      total: 0,
      totalPages: 0,
      currentPage: page,
      searchType: type,
    };

    if (type === 'all' || type === 'clips') {
      const clipFilter: Record<string, any> = {
        $or: [
          { title: { $regex: q, $options: 'i' } },
          { streamer: { $regex: q, $options: 'i' } },
          { submitter: { $regex: q, $options: 'i' } },
        ],
      };

      if (streamer) {
        clipFilter.streamer = { $regex: streamer, $options: 'i' };
      }
      if (submitter) {
        clipFilter.submitter = { $regex: submitter, $options: 'i' };
      }
      if (season && year) {
        clipFilter.season = { $regex: `^${season}$`, $options: 'i' };
        clipFilter.year = year;
      } else if (season) {
        clipFilter.season = { $regex: `^${season}$`, $options: 'i' };
      } else if (year) {
        clipFilter.year = year;
      }

      // Fetch candidates up to 200 items without comments to prevent massive JSON payloads
      const candidateClips = await Clip.find(clipFilter).select('-comments').limit(200).lean();

      const clipFuse = new Fuse(candidateClips, {
        keys: ['title', 'streamer', 'submitter'],
        threshold: 0.3,
        includeScore: true,
      });
      const clipSearchResults = clipFuse.search(q);
      let searchedClips: any[] =
        clipSearchResults.length > 0
          ? clipSearchResults.map((r) => r.item)
          : candidateClips;

      searchedClips = searchedClips.sort((a, b) => {
        switch (sort) {
          case 'oldest':
            return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          case 'upvotes':
            return (b.upvotes || 0) - (a.upvotes || 0);
          case 'downvotes':
            return (b.downvotes || 0) - (a.downvotes || 0);
          case 'ratio': {
            const aRatio = (a.upvotes || 0) / Math.max(a.downvotes || 0, 1);
            const bRatio = (b.upvotes || 0) / Math.max(b.downvotes || 0, 1);
            return bRatio - aRatio;
          }
          case 'newest':
          default:
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }
      });

      if (season && year) {
        results.clips = searchedClips;
      } else {
        const currentSeasonClips: any[] = [];
        const otherSeasonsClips: Record<string, any> = {};
        const availableSeasons = new Set<string>();

        searchedClips.forEach((clip) => {
          const clipSeason = (clip.season || 'unknown').toLowerCase();
          const clipYear = clip.year || new Date(clip.createdAt).getFullYear();
          const seasonKey = `${clipSeason}-${clipYear}`;

          availableSeasons.add(seasonKey);

          if (
            clipSeason === currentSeason.season.toLowerCase() &&
            clipYear === currentSeason.year
          ) {
            currentSeasonClips.push(clip);
          } else {
            if (!otherSeasonsClips[seasonKey]) {
              otherSeasonsClips[seasonKey] = {
                season: clipSeason,
                year: clipYear,
                clips: [],
              };
            }
            otherSeasonsClips[seasonKey].clips.push(clip);
          }
        });

        const sortedSeasons = Array.from(availableSeasons).sort((a, b) => {
          const [aSeason, aYear] = a.split('-');
          const [bSeason, bYear] = b.split('-');
          if (aYear !== bYear) return parseInt(bYear, 10) - parseInt(aYear, 10);
          const seasonOrder: Record<string, number> = {
            winter: 0,
            spring: 1,
            summer: 2,
            fall: 3,
          };
          return (seasonOrder[bSeason] || 0) - (seasonOrder[aSeason] || 0);
        });

        results.currentSeasonClips = currentSeasonClips;
        results.otherSeasonsClips = otherSeasonsClips;
        results.availableSeasons = sortedSeasons;
        results.clips = searchedClips;
      }
    }

    if (type === 'all' || type === 'profiles') {
      const userQuery: any = {
        $or: [
          { username: { $regex: q, $options: 'i' } },
          { discordUsername: { $regex: q, $options: 'i' } },
          { 'profile.bio': { $regex: q, $options: 'i' } },
        ],
        status: 'active',
        'profile.isPublic': true,
      };

      const users = await User.find(userQuery)
        .select(
          '_id username profilePicture roles discordUsername discordId createdAt profile joinDate'
        )
        .limit(50)
        .lean();

      const discordIds = users.map((u) => u.discordId).filter(Boolean);
      let countMap = new Map<string, number>();

      if (discordIds.length > 0) {
        try {
          const counts = await Clip.aggregate([
            { $match: { discordSubmitterId: { $in: discordIds } } },
            { $group: { _id: '$discordSubmitterId', count: { $sum: 1 } } },
          ]);
          countMap = new Map(counts.map((c) => [c._id, c.count]));
        } catch {
          // Fallback if aggregation fails
        }
      }

      const profilesWithStats = users.map((user) => {
        const clipsSubmitted = user.discordId ? (countMap.get(user.discordId) || 0) : 0;
        return {
          _id: user._id,
          username: user.username,
          profilePicture: user.profilePicture,
          roles: user.roles,
          discordUsername: user.discordUsername,
          bio: user.profile?.bio || '',
          website: user.profile?.socialLinks?.website || '',
          socialLinks: user.profile?.socialLinks || {},
          joinDate: user.joinDate || user.createdAt,
          lastActive: user.profile?.lastActive || user.createdAt,
          isPublic: user.profile?.isPublic !== false,
          stats: {
            clipsSubmitted,
            joinDate: user.joinDate || user.createdAt,
          },
        };
      });

      results.profiles = profilesWithStats.sort(
        (a: any, b: any) =>
          new Date(b.lastActive || b.joinDate).getTime() -
          new Date(a.lastActive || a.joinDate).getTime()
      );
    }

    const totalClips = results.clips?.length || 0;
    const totalProfiles = results.profiles?.length || 0;
    results.total = totalClips + totalProfiles;
    results.totalPages = Math.ceil(results.total / limit);

    if (type === 'all') {
      results.profiles = results.profiles.slice(skip, skip + limit);
    } else if (type === 'clips') {
      results.profiles = [];
    } else if (type === 'profiles') {
      results.profiles = results.profiles.slice(skip, skip + limit);
      results.clips = [];
      results.currentSeasonClips = [];
      results.otherSeasonsClips = {};
    }

    return NextResponse.json(results);
  } catch (error: any) {
    console.error('Error in unified search:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
