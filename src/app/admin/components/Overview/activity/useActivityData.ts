'use client';

import { useState, useEffect } from 'react';
import * as ratingService from '@/services/ratingService';

export interface ActivityData {
  date: string;
  count: number;
  username?: string;
}

export interface UserActivityData {
  [key: string]: ActivityData[];
}

interface RawUserRating {
  timestamp?: string | Date;
  rating?: string;
}

interface RawUserActivity {
  username?: string;
  ratings?: RawUserRating[];
}

export function useActivityData() {
  const [activityData, setActivityData] = useState<ActivityData[]>([]);
  const [userActivityData, setUserActivityData] = useState<UserActivityData>({});
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<{ start: Date | null; end: Date | null }>({
    start: new Date(Date.now() - 29 * 24 * 60 * 60 * 1000),
    end: new Date(Date.now()),
  });

  const processActivityData = (userData: RawUserActivity[]) => {
    if (!Array.isArray(userData) || userData.length === 0) {
      setActivityData([]);
      setUserActivityData({});
      return;
    }

    const activityByDate: { [date: string]: number } = {};
    const userActivityByDate: { [username: string]: { [date: string]: number } } = {};
    let earliestDate: Date | null = null;
    let latestDate: Date | null = null;

    userData.forEach((user) => {
      const username = user.username;
      if (!username || !Array.isArray(user.ratings)) return;

      if (!userActivityByDate[username]) {
        userActivityByDate[username] = {};
      }

      user.ratings.forEach((rating) => {
        if (!rating.timestamp) return;

        const date = new Date(rating.timestamp);

        if (dateRange.start && date < dateRange.start) return;
        if (dateRange.end) {
          const endOfDay = new Date(dateRange.end);
          endOfDay.setHours(23, 59, 59, 999);
          if (date > endOfDay) return;
        }

        if (!earliestDate || date < earliestDate) earliestDate = date;
        if (!latestDate || date > latestDate) latestDate = date;

        const dateKey = date.toISOString().split('T')[0];
        activityByDate[dateKey] = (activityByDate[dateKey] || 0) + 1;
        userActivityByDate[username][dateKey] =
          (userActivityByDate[username][dateKey] || 0) + 1;
      });
    });

    const startDate = dateRange.start || earliestDate || new Date();
    const endDate = dateRange.end || latestDate || new Date();

    const allDates: string[] = [];
    const currentDate = new Date(startDate);
    currentDate.setHours(0, 0, 0, 0);

    const finalEndDate = new Date(endDate);
    finalEndDate.setHours(23, 59, 59, 999);

    while (currentDate <= finalEndDate) {
      allDates.push(currentDate.toISOString().split('T')[0]);
      currentDate.setDate(currentDate.getDate() + 1);
    }

    const formattedOverallData: ActivityData[] = allDates.map((date) => ({
      date,
      count: activityByDate[date] || 0,
    }));

    const formattedUserData: UserActivityData = {};
    Object.keys(userActivityByDate).forEach((username) => {
      formattedUserData[username] = allDates.map((date) => ({
        date,
        count: userActivityByDate[username][date] || 0,
        username,
      }));
    });

    setActivityData(formattedOverallData);
    setUserActivityData(formattedUserData);
  };

  const fetchActivityData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params: { startDate?: string; endDate?: string } = {};

      if (dateRange.start) {
        params.startDate = dateRange.start.toISOString().split('T')[0];
      }
      if (dateRange.end) {
        const endDate = new Date(dateRange.end);
        endDate.setHours(23, 59, 59, 999);
        params.endDate = endDate.toISOString().split('T')[0];
      }

      const data = await ratingService.getRatingActivity(params);
      processActivityData(data);
    } catch {
      setError('Failed to load activity data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchActivityData();
  }, [dateRange]);

  return {
    activityData,
    userActivityData,
    isLoading,
    error,
    dateRange,
    setDateRange,
  };
}

export default useActivityData;
