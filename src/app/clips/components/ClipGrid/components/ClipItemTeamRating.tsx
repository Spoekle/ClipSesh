import React from 'react';
import { Star, Ban } from 'lucide-react';

interface ClipItemTeamRatingProps {
  averageRating: string;
  totalRatings: number;
  denialCount: number;
}

export const ClipItemTeamRating: React.FC<ClipItemTeamRatingProps> = ({
  averageRating,
  totalRatings,
  denialCount,
}) => {
  return (
    <div className="flex items-center gap-2 mt-2">
      {averageRating && averageRating !== '0.0' && (
        <div
          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-secondary border border-border text-[11px] text-foreground font-medium"
          title={totalRatings > 0 ? `Ratings: ${totalRatings}` : 'No ratings yet'}
        >
          <Star className="size-2.5 text-amber-400 fill-amber-400" />
          <span>{averageRating}</span>
          {totalRatings > 0 && (
            <span className="text-[10px] text-muted-foreground">({totalRatings})</span>
          )}
        </div>
      )}

      {denialCount > 0 && (
        <div
          className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-destructive/10 border border-destructive/25 text-[11px] text-destructive font-medium"
          title={`Denied count: ${denialCount}`}
        >
          <Ban className="size-2.5" />
          <span>{denialCount}</span>
        </div>
      )}
    </div>
  );
};
