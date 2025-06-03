import React from 'react';
import { FaTrophy } from 'react-icons/fa';
import { motion } from 'framer-motion';
import { Trophy } from '../../../types/adminTypes';

interface TrophyDisplayProps {
  trophies: Trophy[];
  username?: string;
  compact?: boolean;
}

const TrophyDisplay: React.FC<TrophyDisplayProps> = ({ 
  trophies, 
  username, 
  compact = false 
}) => {
  // Function to determine season from dateEarned string (e.g., "Summer 2025", "Fall 2024")
  const getSeasonFromDate = (dateString: string) => {
    const lowerCaseDate = dateString.toLowerCase();
    
    if (lowerCaseDate.includes('spring')) {
      return 'spring';
    } else if (lowerCaseDate.includes('summer')) {
      return 'summer';
    } else if (lowerCaseDate.includes('fall') || lowerCaseDate.includes('autumn')) {
      return 'autumn';
    } else if (lowerCaseDate.includes('winter')) {
      return 'winter';
    } else {
      return 'winter';
    }
  };

  // Function to get modern colors based on season with light/dark mode support
  const getSeasonColors = (season: string) => {
    switch (season) {
      case 'spring':
        return {
          gradient: 'from-emerald-400 via-green-500 to-emerald-600',
          lightGradient: 'from-emerald-50 via-green-100 to-emerald-200',
          iconColor: 'text-emerald-900 dark:text-emerald-100',
          decoration: 'bg-emerald-300/40 dark:bg-emerald-500/20',
          dotColor: 'bg-emerald-500',
          textColor: 'text-emerald-600 dark:text-emerald-400',
          border: 'border-emerald-200 dark:border-emerald-700'
        };
      case 'summer':
        return {
          gradient: 'from-yellow-400 via-amber-500 to-orange-500',
          lightGradient: 'from-yellow-50 via-amber-100 to-orange-200',
          iconColor: 'text-amber-900 dark:text-amber-100',
          decoration: 'bg-amber-300/40 dark:bg-amber-500/20',
          dotColor: 'bg-amber-500',
          textColor: 'text-amber-600 dark:text-amber-400',
          border: 'border-amber-200 dark:border-amber-700'
        };
      case 'autumn':
        return {
          gradient: 'from-orange-400 via-red-500 to-orange-600',
          lightGradient: 'from-orange-50 via-red-100 to-orange-200',
          iconColor: 'text-orange-900 dark:text-orange-100',
          decoration: 'bg-orange-300/40 dark:bg-orange-500/20',
          dotColor: 'bg-orange-500',
          textColor: 'text-orange-600 dark:text-orange-400',
          border: 'border-orange-200 dark:border-orange-700'
        };
      case 'winter':
      default:
        return {
          gradient: 'from-blue-400 via-indigo-500 to-blue-600',
          lightGradient: 'from-blue-50 via-indigo-100 to-blue-200',
          iconColor: 'text-blue-900 dark:text-blue-100',
          decoration: 'bg-blue-300/40 dark:bg-blue-500/20',
          dotColor: 'bg-blue-500',
          textColor: 'text-blue-600 dark:text-blue-400',
          border: 'border-blue-200 dark:border-blue-700'
        };
    }
  };

  if (!trophies || trophies.length === 0) {
    if (compact) return null;
    
    return (
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 p-8 rounded-2xl text-center shadow-sm hover:shadow-md transition-shadow duration-300"
      >
        <div className="p-4 bg-gradient-to-br from-neutral-100 to-neutral-200 dark:from-neutral-700 dark:to-neutral-600 rounded-full w-20 h-20 mx-auto mb-4 flex items-center justify-center shadow-inner">
          <FaTrophy className="text-3xl text-neutral-500 dark:text-neutral-400" />
        </div>
        <h3 className="text-xl font-semibold text-neutral-800 dark:text-neutral-200 mb-2">
          No trophies yet
        </h3>
        <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed">
          {username ? `${username} hasn't` : "You haven't"} earned any trophies yet. Keep rating clips to unlock achievements!
        </p>
      </motion.div>
    );
  }

  if (compact) {
    return (
      <div className="flex items-center gap-3">
        <div className="p-2.5 bg-gradient-to-br from-amber-50 to-yellow-100 dark:from-amber-900/30 dark:to-yellow-900/30 rounded-xl border border-amber-200 dark:border-amber-700">
          <FaTrophy className="text-amber-600 dark:text-amber-400 text-lg" />
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">
            {trophies.length} {trophies.length === 1 ? 'trophy' : 'trophies'}
          </span>
          <span className="text-xs text-neutral-500 dark:text-neutral-400">earned</span>
        </div>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="flex items-center gap-4 border-b border-neutral-200 dark:border-neutral-700 pb-4">
        <div className="p-3 bg-gradient-to-br from-amber-50 to-yellow-100 dark:from-amber-900/30 dark:to-yellow-900/30 rounded-xl border border-amber-200 dark:border-amber-700">
          <FaTrophy className="text-amber-600 dark:text-amber-400 text-2xl" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-neutral-900 dark:text-white">
            Trophies
          </h2>
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            {trophies.length} achievement{trophies.length !== 1 ? 's' : ''} earned
          </p>
        </div>
      </div>

      <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 2xl:grid-cols-12 gap-3">
        {trophies.map((trophy, index) => {
          const season = getSeasonFromDate(trophy.dateEarned);
          const colors = getSeasonColors(season);
          
          return (
            <motion.div
              key={trophy._id}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.03 }}
              whileHover={{ 
                scale: 1.1, 
                zIndex: 10,
                transition: { type: "spring", stiffness: 400, damping: 17 }
              }}
              className="relative group aspect-square"
            >
              {/* Trophy Card */}
              <div className={`w-full h-full bg-gradient-to-br ${colors.gradient} dark:${colors.gradient} rounded-xl p-3 shadow-lg hover:shadow-xl transition-all duration-300 flex flex-col items-center justify-center relative overflow-hidden border-2 ${colors.border}`}>
                {/* Shine effect for modern look */}
                <div className="absolute inset-0 bg-gradient-to-tr from-white/20 via-transparent to-transparent opacity-50"></div>
                
                {/* Background decoration */}
                <div className={`absolute top-0 right-0 w-8 h-8 -mt-3 -mr-3 rounded-full ${colors.decoration}`}></div>
                
                {/* Trophy icon with better contrast */}
                <FaTrophy className={`${colors.iconColor} text-xl mb-1 drop-shadow-sm`} />
                
                {/* Trophy name - truncated with better typography */}
                <h3 className={`text-xs font-bold ${colors.iconColor} text-center line-clamp-2 leading-tight drop-shadow-sm`}>
                  {trophy.trophyName}
                </h3>
              </div>

              {/* Modern Hover Tooltip */}
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-3 px-4 py-3 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-600 text-neutral-900 dark:text-white text-sm rounded-xl shadow-xl opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none z-30 min-w-48 max-w-64 backdrop-blur-sm">
                <div className="text-center">
                  <h4 className="font-bold mb-2 text-neutral-900 dark:text-white">{trophy.trophyName}</h4>
                  <p className="text-neutral-600 dark:text-neutral-300 mb-3 leading-relaxed text-xs">
                    {trophy.description}
                  </p>
                  <div className="flex items-center justify-center gap-2 px-3 py-2 bg-neutral-50 dark:bg-neutral-700 rounded-lg">
                    <div className={`w-2 h-2 rounded-full ${colors.dotColor} shadow-sm`}></div>
                    <span className={`text-xs font-medium ${colors.textColor}`}>
                      {trophy.dateEarned}
                    </span>
                  </div>
                </div>
                
                {/* Modern tooltip arrow */}
                <div className="absolute top-full left-1/2 transform -translate-x-1/2">
                  <div className="border-l-8 border-r-8 border-t-8 border-transparent border-t-white dark:border-t-neutral-800"></div>
                  <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 border-l-7 border-r-7 border-t-7 border-transparent border-t-neutral-200 dark:border-t-neutral-600"></div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
};

export default TrophyDisplay;
