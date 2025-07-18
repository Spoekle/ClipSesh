import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '../lib/react-query';
import * as ratingService from '../services/ratingService';
import { RatingQueryParams } from '../types/ratingTypes';

// Hook for fetching user's own ratings
export const useMyRatings = (params: RatingQueryParams = {}) => {
  return useQuery({
    queryKey: queryKeys.ratings.bulk(['my-ratings', JSON.stringify(params)]),
    queryFn: () => ratingService.getMyRatings(params),
    enabled: Boolean(localStorage.getItem('token')),
  });
};

// Hook for fetching a specific clip's rating
export const useRating = (clipId: string) => {
  return useQuery({
    queryKey: queryKeys.ratings.detail(clipId),
    queryFn: () => ratingService.getRatingById(clipId),
    enabled: Boolean(clipId),
  });
};

// Hook for fetching bulk ratings
export const useBulkRatings = (clipIds: string[]) => {
  return useQuery({
    queryKey: queryKeys.ratings.bulk(clipIds),
    queryFn: () => ratingService.getBulkRatings(clipIds),
    enabled: clipIds.length > 0,
  });
};

// Hook for fetching user rating stats
export const useUserRatingStats = (userId?: string) => {
  return useQuery({
    queryKey: ['ratings', 'stats', userId || 'current'],
    queryFn: () => ratingService.getUserRatingStats(userId),
    enabled: Boolean(localStorage.getItem('token')),
  });
};

// Hook for fetching rating activity
export const useRatingActivity = (params: { startDate?: string; endDate?: string }) => {
  return useQuery({
    queryKey: ['ratings', 'activity', params],
    queryFn: () => ratingService.getRatingActivity(params),
    enabled: Boolean(localStorage.getItem('token')),
  });
};

// Mutation for submitting a rating
export const useSubmitRating = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ clipId, rating }: { clipId: string; rating: '1' | '2' | '3' | '4' | 'deny' }) =>
      ratingService.submitRating(clipId, rating),
    onSuccess: (data, { clipId }) => {
      queryClient.setQueryData(queryKeys.ratings.detail(clipId), data);
      queryClient.invalidateQueries({ queryKey: queryKeys.ratings.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.clips.all });
    },
  });
};

// Mutation for updating a rating
export const useUpdateRating = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ clipId, rating }: { clipId: string; rating: '1' | '2' | '3' | '4' | 'deny' }) =>
      ratingService.updateRating(clipId, rating),
    onSuccess: (data, { clipId }) => {
      queryClient.setQueryData(queryKeys.ratings.detail(clipId), data);
      queryClient.invalidateQueries({ queryKey: queryKeys.ratings.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.clips.all });
    },
  });
};

// Mutation for deleting a rating
export const useDeleteRating = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (clipId: string) => ratingService.deleteRating(clipId),
    onSuccess: (_, clipId) => {
      queryClient.removeQueries({ queryKey: queryKeys.ratings.detail(clipId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.ratings.all });
      queryClient.invalidateQueries({ queryKey: queryKeys.clips.all });
    },
  });
};
