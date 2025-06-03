import React from 'react';
import { FaTrophy } from 'react-icons/fa';
import { motion } from 'framer-motion';

interface Trophy {
  _id: string;
  trophyName: string;
  description: string;
  dateEarned: string;
}

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
  if (!trophies || trophies.length === 0) {
    if (compact) return null;
    
    return (
      <div className="bg-neutral-300 dark:bg-neutral-800 p-8 rounded-xl text-center">
        <FaTrophy className="text-6xl text-neutral-500 dark:text-neutral-400 mb-4 mx-auto" />
        <h3 className="text-xl font-semibold text-neutral-700 dark:text-neutral-300 mb-2">
          No trophies yet
        </h3>
        <p className="text-neutral-600 dark:text-neutral-400">
          {username ? `${username} hasn't` : "You haven't"} earned any trophies yet.
        </p>
      </div>
    );
  }

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <FaTrophy className="text-yellow-500 text-lg" />
        <span className="text-sm text-neutral-600 dark:text-neutral-400">
          {trophies.length} {trophies.length === 1 ? 'trophy' : 'trophies'}
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <FaTrophy className="text-yellow-500 text-2xl" />
        <h2 className="text-2xl font-bold text-neutral-900 dark:text-white">
          Trophies ({trophies.length})
        </h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {trophies.map((trophy, index) => (
          <motion.div
            key={trophy._id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="relative bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-xl p-6 text-black shadow-lg hover:shadow-xl transition-shadow overflow-hidden"
          >
            {/* Background decoration */}
            <div className="absolute top-0 right-0 w-16 h-16 -mt-6 -mr-6 rounded-full bg-yellow-300/30"></div>
            
            {/* Trophy icon */}
            <div className="absolute -top-4 left-4 bg-yellow-500 rounded-full p-3 border-4 border-white shadow-md">
              <FaTrophy className="text-yellow-900 text-lg" />
            </div>
            
            <div className="pt-8">
              <h3 className="text-lg font-bold mb-2 leading-tight">
                {trophy.trophyName}
              </h3>
              
              <p className="text-sm mb-4 opacity-80 leading-relaxed">
                {trophy.description}
              </p>
              
              <div className="inline-block bg-yellow-300/50 px-3 py-1 rounded-full">
                <span className="text-xs font-semibold">
                  {trophy.dateEarned}
                </span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default TrophyDisplay;
