'use client';

import { useMemo, useCallback, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAdjacentClipsFromCache } from '@/hooks/useClips';
import { Clip, User } from '@/types/adminTypes';
import { BreadcrumbItem, routeCrumbs } from '@/lib/breadcrumbs';

interface UseClipNavigationOptions {
  currentClipId: string;
  user: User | null;
  setExpandedClip?: React.Dispatch<React.SetStateAction<string | null>> | ((clipId: string | null) => void);
  /** Trail between "Home" and the clip; the last entry is the back target. Defaults to Clips. */
  parentCrumbs?: BreadcrumbItem[];
  isClipLoading: boolean;
}

export function useClipNavigation({
  currentClipId,
  user,
  setExpandedClip,
  parentCrumbs: providedParentCrumbs,
  isClipLoading,
}: UseClipNavigationOptions) {
  const router = useRouter();
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

  const currentSearch = searchParams?.toString() ?? '';
  const parentCrumbs: BreadcrumbItem[] =
    providedParentCrumbs && providedParentCrumbs.length > 0
      ? providedParentCrumbs
      : [
          {
            label: routeCrumbs.clips.label,
            href: currentSearch ? `${routeCrumbs.clips.href}?${currentSearch}` : routeCrumbs.clips.href,
            onClick: setExpandedClip ? () => setExpandedClip(null) : undefined,
          },
        ];
  const backCrumb = parentCrumbs.at(-1);
  const backHref = backCrumb?.href ?? routeCrumbs.clips.href;

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
    router.push(backHref);
  }, [setExpandedClip, backHref, router]);

  return {
    nextClip,
    prevClip,
    loadingAdjacentClips,
    navigateToClip,
    closeExpandedClip,
    parentCrumbs,
    backLabel: backCrumb?.label ?? routeCrumbs.clips.label,
  };
}

export default useClipNavigation;
