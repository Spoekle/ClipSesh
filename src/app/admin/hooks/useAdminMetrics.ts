'use client';

import { useMemo } from 'react';
import { Clip, Rating, UserRating, User } from '@/types/adminTypes';
import { getCurrentSeason } from '@/lib/seasonHelpers';

export function useAdminMetrics(
  clips: Clip[],
  ratings: Record<string, Rating>,
  allUsers: User[],
  denyThreshold: number
) {
  const admins = useMemo(
    () => allUsers.filter((user) => user.roles?.includes('admin') || false),
    [allUsers]
  );

  const clipTeam = useMemo(
    () => allUsers.filter((user) => user.roles?.includes('clipteam') || false),
    [allUsers]
  );

  const disabledUsers = useMemo(
    () => allUsers.filter((user) => user.status === 'disabled'),
    [allUsers]
  );

  const seasonInfo = useMemo(() => {
    const { season, year } = getCurrentSeason();
    return {
      season,
      year,
      clipAmount: clips.length,
    };
  }, [clips.length]);

  const userRatings: UserRating[] = useMemo(() => {
    if (Object.keys(ratings).length === 0) return [];

    const userRatingCount: Record<string, Omit<UserRating, 'username'>> = {};

    [...clipTeam, ...admins]
      .filter((user) => user.username !== 'UploadBot')
      .forEach((user) => {
        userRatingCount[user.username] = {
          '1': 0,
          '2': 0,
          '3': 0,
          '4': 0,
          deny: 0,
          total: 0,
          percentageRated: 0,
        };
      });

    const clipLength = Object.keys(ratings).length;

    Object.keys(ratings).forEach((clipId) => {
      const clipRatingData = ratings[clipId]?.ratings;
      if (!clipRatingData) return;

      const ratingLevels = ['1', '2', '3', '4', 'deny'] as const;
      ratingLevels.forEach((rating) => {
        const usersWithThisRating = clipRatingData[rating];
        if (Array.isArray(usersWithThisRating)) {
          usersWithThisRating.forEach((userObj) => {
            const username = userObj.username;
            if (userRatingCount[username]) {
              userRatingCount[username][rating]++;
              userRatingCount[username].total++;
            }
          });
        }
      });
    });

    Object.keys(userRatingCount).forEach((username) => {
      userRatingCount[username].percentageRated =
        (userRatingCount[username].total / (seasonInfo.clipAmount || clipLength)) * 100;
    });

    return Object.entries(userRatingCount)
      .map(([username, counts]) => ({
        username,
        ...counts,
      }))
      .sort((a, b) => b.total - a.total);
  }, [ratings, clipTeam, admins, seasonInfo.clipAmount]);

  const clipStats = useMemo(() => {
    const totalClips = clips.length;
    let ratedClips = 0;
    let deniedClips = 0;

    Object.keys(ratings).forEach((clipId) => {
      const clipRatingData = ratings[clipId]?.ratings;
      if (clipRatingData) {
        const ratingLevels = ['1', '2', '3', '4', 'deny'] as const;
        const hasRatings = ratingLevels.some(
          (rating) =>
            clipRatingData[rating] &&
            Array.isArray(clipRatingData[rating]) &&
            (clipRatingData[rating]?.length ?? 0) > 0
        );

        if (hasRatings) ratedClips++;

        if (
          clipRatingData.deny &&
          Array.isArray(clipRatingData.deny) &&
          clipRatingData.deny.length >= denyThreshold
        ) {
          deniedClips++;
        }
      }
    });

    return {
      totalClips,
      ratedClips,
      unratedClips: totalClips - ratedClips,
      deniedClips,
    };
  }, [clips, ratings, denyThreshold]);

  return {
    admins,
    clipTeam,
    disabledUsers,
    seasonInfo,
    userRatings,
    clipStats,
  };
}

export default useAdminMetrics;
