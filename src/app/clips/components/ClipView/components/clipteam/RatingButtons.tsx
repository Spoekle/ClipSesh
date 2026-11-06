'use client';

import React from 'react';
import { X } from 'lucide-react';

interface RatingButtonsProps {
  userCurrentRating: string | null;
  cannotRateOwnClip: boolean;
  isDenied: boolean;
  isDisabled: boolean;
  isSubmitting: boolean;
  onRateOrDeny: (rating: number | null, deny: boolean) => void;
}

export const RatingButtons: React.FC<RatingButtonsProps> = ({
  userCurrentRating,
  cannotRateOwnClip,
  isDenied,
  isDisabled,
  isSubmitting,
  onRateOrDeny,
}) => {
  const getButtonColors = (rating: number, selected: boolean) => {
    if (selected) {
      return 'bg-primary text-primary-foreground shadow-md ring-2 ring-primary/50';
    } else if (cannotRateOwnClip) {
      return 'bg-background/50 border border-border text-muted-foreground/50 cursor-not-allowed';
    } else {
      return 'bg-background border border-border text-foreground hover:border-primary hover:text-primary transition-colors';
    }
  };

  return (
    <div className="grid grid-cols-5 gap-3">
      {[1, 2, 3, 4].map((rate) => {
        const isSelected = userCurrentRating === rate.toString();

        return (
          <button
            key={rate}
            type="button"
            className={`flex flex-col items-center justify-center py-4 px-2 rounded-xl font-bold transition-all duration-200 cursor-pointer ${getButtonColors(
              rate,
              isSelected
            )} ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
            onClick={() => !isDisabled && onRateOrDeny(rate, false)}
            disabled={isDisabled}
            title={cannotRateOwnClip ? 'You cannot rate your own clips' : `Rate ${rate}`}
          >
            <span className="text-2xl">{rate}</span>
          </button>
        );
      })}

      {/* Deny button */}
      <button
        type="button"
        className={`flex flex-col items-center justify-center py-4 px-2 rounded-xl font-bold transition-all duration-200 cursor-pointer ${
          isDenied
            ? 'bg-primary text-primary-foreground shadow-lg ring-2 ring-primary/50'
            : cannotRateOwnClip
            ? 'bg-background/50 border border-border text-muted-foreground/50 cursor-not-allowed'
            : 'bg-background border border-border text-foreground hover:bg-primary hover:text-primary-foreground'
        } ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}`}
        onClick={() => !isDisabled && onRateOrDeny(null, true)}
        disabled={isDisabled}
        title={cannotRateOwnClip ? 'You cannot deny your own clips' : 'Deny this clip'}
      >
        <span className="text-2xl">
          <X className="size-6" />
        </span>
      </button>
    </div>
  );
};

export default RatingButtons;
