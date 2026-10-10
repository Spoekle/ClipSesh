import React from 'react';
import { FaStar, FaBan } from 'react-icons/fa';

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
          <FaStar className="text-amber-400" size={9} />
          <span>{averageRating}</span>
          {totalRatings > 0 && (
            <span className="text-[10px] text-muted-foreground">({totalRatings})</span>
          )}
        </div>
      )}

      {denialCount > 0 && (
        <div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-red-500/10 border border-red-500/25 text-[11px] text-red-400 font-medium">
          <FaBan size={9} />
          <span>{denialCount}</span>
        </div>
      )}
    </div>
  );
};
