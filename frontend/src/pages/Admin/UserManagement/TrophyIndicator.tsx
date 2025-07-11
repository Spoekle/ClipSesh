import React from 'react';
import { FaTrophy } from 'react-icons/fa';

interface Trophy {
  _id: string;
  trophyName: string;
  description: string;
  dateEarned: string;
}

interface TrophyIndicatorProps {
  trophies: Trophy[];
  size?: 'small' | 'medium';
}

const TrophyIndicator: React.FC<TrophyIndicatorProps> = ({ 
  trophies, 
  size = 'small' 
}) => {

  if (!trophies || trophies.length === 0) {
    return null;
  }

  const iconSize = size === 'small' ? 16 : 20;

  return (
    <div 
      className="relative inline-flex items-center cursor-pointer"
    >
      <div className="relative">
        <FaTrophy 
          size={iconSize}
          className="text-yellow-500 hover:text-yellow-400 transition-colors"
        />
        {trophies.length > 0 && (
          <span className="absolute -top-2 -right-2 bg-yellow-500 text-black text-xs rounded-full h-4 w-4 flex items-center justify-center font-bold">
            {trophies.length > 99 ? '99+' : trophies.length}
          </span>
        )}
      </div>
    </div>
  );
};

export default TrophyIndicator;
