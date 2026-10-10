'use client';

import { useMemo, useCallback, useEffect } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useAdjacentClipsFromCache } from '@/hooks/useClips';
import { Clip, User } from '@/types/adminTypes';

interface UseClipNavigationOptions {
  currentClipId: string;
  user: User | null;
  setExpandedClip?: React.Dispatch<React.SetStateAction<string | null>> | ((clipId: string | null) => void);
  fromContext?: {
    label: string;
    path: string;
    season?: string;
    year?: number;
  };
  isClipLoading: boolean;
}

export function useClipNavigation({
  currentClipId,
  user,
  setExpandedClip,
  fromContext,
  isClipLoading,
}: UseClipNavigationOptions) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const adjacentClipParams = useMemo(() => {
    const urlParams = new URLSearchParams(typeof window !== 'undefined' ? window.location.search : '');
    const sortOption = urlParams.get('sort') || 'newest';

    const params: Record<string, string | boolean | undefined> = {
      sortOption,
    };

    if (sortOption.includes('_')) {
      const [field, direction] = sortOption.split('_');
      params.sortBy = field;
      params.sortOrder = direction;
    } else {
      switch (sortOption) {
        case 'newest':
          params.sortBy = 'createdAt';
          params.sortOrder = 'desc';
          break;
        case 'oldest':
          params.sortBy = 'createdAt';
          params.sortOrder = 'asc';
          break;
        case 'highestUpvotes':
          params.sortBy = 'upvotes';
          params.sortOrder = 'desc';
          break;
        case 'highestDownvotes':
          params.sortBy = 'downvotes';
          params.sortOrder = 'desc';
          break;
        case 'lowestRatio':
          params.sortBy = 'ratio';
          params.sortOrder = 'asc';
          break;
        case 'highestRatio':
          params.sortBy = 'ratio';
          params.sortOrder = 'desc';
          break;
        case 'highestAverageRating':
          params.sortBy = 'averageRating';
          params.sortOrder = 'desc';
          break;
        case 'mostRated':
          params.sortBy = 'ratingCount';
          params.sortOrder = 'desc';
          break;
        case 'mostDenied':
          params.sortBy = 'denyCount';
          params.sortOrder = 'desc';
          break;
        default:
          params.sortBy = 'createdAt';
          params.sortOrder = 'desc';
      }
    }

    if (urlParams.get('streamer')) {
      params.streamer = urlParams.get('streamer') || undefined;
    }
    if (urlParams.get('excludeRatedByUser')) {
      params.excludeRatedByUser = urlParams.get('excludeRatedByUser') || undefined;
    }
    if (urlParams.get('excludeDeniedClips') === 'true') {
      params.excludeDeniedClips = true;
    }
    if (urlParams.get('q')) {
      params.search = urlParams.get('q') || undefined;
    }
    if (user && (user.roles?.includes('admin') || user.roles?.includes('clipteam'))) {
      params.includeRatings = true;
    }

    return params;
  }, [user]);

  const { data: adjacentClips, isLoading: loadingAdjacentClips } = useAdjacentClipsFromCache(
    currentClipId,
    adjacentClipParams
  );

  const nextClip: Clip | null = adjacentClips?.next || null;
  const prevClip: Clip | null = adjacentClips?.previous || null;

  const from = useMemo(() => {
    if (fromContext) {
      return {
        pathname: fromContext.path.split('?')[0] || '/archive',
        search: fromContext.path.includes('?') ? `?${fromContext.path.split('?')[1]}` : '',
        label: fromContext.label,
        season: fromContext.season,
        year: fromContext.year,
      };
    }

    const curPath = typeof window !== 'undefined' ? window.location.pathname : pathname || '/clips';
    const curSearch = typeof window !== 'undefined' ? window.location.search : searchParams?.toString() ? `?${searchParams.toString()}` : '';

    let defaultPathname = '/clips';
    let defaultLabel = 'Clips';
    if (curPath.includes('archive') || curPath.includes('search')) {
      defaultPathname = '/archive';
      defaultLabel = 'Archive';
    } else if (curPath.includes('admin')) {
      defaultPathname = '/admin';
      defaultLabel = 'Admin';
    }

    const curSp = new URLSearchParams(curSearch);
    return {
      pathname: defaultPathname,
      search: curSearch,
      label: defaultLabel,
      season: curSp.get('season') || undefined,
      year: curSp.get('year') ? parseInt(curSp.get('year')!, 10) : undefined,
    };
  }, [fromContext, pathname, searchParams]);

  const navigateToClip = useCallback(
    (targetClipId: string) => {
      if (isClipLoading || !targetClipId) return;

      if (setExpandedClip) {
        setExpandedClip(targetClipId);
        return;
      }

      const currentSearchParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : new URLSearchParams();
      const searchString = currentSearchParams.toString();
      router.replace(`/clips/${targetClipId}${searchString ? `?${searchString}` : ''}`);
    },
    [isClipLoading, setExpandedClip, router]
  );

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
        return;
      }
      if (e.key === 'ArrowRight' && nextClip?._id) {
        navigateToClip(nextClip._id);
      } else if (e.key === 'ArrowLeft' && prevClip?._id) {
        navigateToClip(prevClip._id);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [nextClip, prevClip, navigateToClip]);

  const closeExpandedClip = useCallback((): void => {
    if (setExpandedClip) {
      setExpandedClip(null);
      return;
    }
    const targetPath = from.pathname || '/clips';
    const searchString = from.search ? (from.search.startsWith('?') ? from.search : `?${from.search}`) : '';
    router.push(`${targetPath}${searchString}`);
  }, [setExpandedClip, from, router]);

  return {
    nextClip,
    prevClip,
    loadingAdjacentClips,
    navigateToClip,
    closeExpandedClip,
    from,
  };
}

export default useClipNavigation;
