import React, { useState } from 'react';
import SummaryStats from './statistics/SummaryStats';
import RatingDistribution from './statistics/RatingDistribution';
import IndividualPerformance from './statistics/IndividualPerformance';
import ComparisonChart from './statistics/ComparisonChart';
import ActivityTracker from './statistics/ActivityTracker';
import { motion } from 'framer-motion';
import { FaChartBar } from 'react-icons/fa';
import { UserRating, SeasonInfo } from '../../../types/adminTypes';

interface User {
  _id: string;
  username: string;
  roles: string[];
  [key: string]: any;
}

interface StatisticsProps {
  clipTeam: User[];
  userRatings: UserRating[];
  seasonInfo: SeasonInfo;
  adminStats?: any;
  loading?: boolean;
}

const Statistics: React.FC<StatisticsProps> = ({ clipTeam, userRatings, seasonInfo, loading = false }) => {
    const [sortBy, setSortBy] = useState<'username' | 'rating' | 'percentage'>('rating');
    
    // Skeleton component for loading states
    const SkeletonBox = ({ className = "" }: { className?: string }) => (
      <div className={`animate-pulse bg-neutral-400 dark:bg-neutral-600 rounded ${className}`}></div>
    );
    
    // Calculate overall stats for team
    const totalRatings = userRatings.reduce((acc, user) => acc + user.total, 0);
    const averageRatings = userRatings.length > 0 ? totalRatings / userRatings.length : 0;
    const mostActiveUser = [...userRatings].sort((a, b) => b.total - a.total)[0]?.username || 'No data';
    
    // Sort users based on the selected criteria
    const sortedUsers = [...userRatings].sort((a, b) => {
        if (sortBy === 'username') {
            return a.username.localeCompare(b.username);
        } else if (sortBy === 'rating') {
            return b.total - a.total;
        } else if (sortBy === 'percentage') {
            return b.percentageRated - a.percentageRated;
        }
        return 0;
    });

    // Get usernames for the clip team members
    const clipTeamUsernames = clipTeam.map(member => member.username || '').filter(Boolean);    return (
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="w-full p-6 md:p-8 mt-8 bg-neutral-300 dark:bg-neutral-800 text-neutral-900 dark:text-white transition duration-200 rounded-xl shadow-lg hover:shadow-xl"
        >
            <h2 className="text-2xl md:text-3xl font-bold mb-6 border-b pb-3 border-neutral-400 dark:border-neutral-700 flex items-center">
                <FaChartBar className="mr-3 text-blue-500" /> 
                Team Performance
            </h2>
            
            {loading ? (
                <div className="space-y-6">
                    {/* Summary stats skeleton */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {[1, 2, 3].map((index) => (
                            <div key={index} className="p-4 bg-neutral-200 dark:bg-neutral-700 rounded-lg">
                                <SkeletonBox className="h-4 w-24 mb-2" />
                                <SkeletonBox className="h-8 w-16" />
                            </div>
                        ))}
                    </div>
                    
                    {/* Charts skeleton */}
                    <div className="space-y-4">
                        <SkeletonBox className="h-6 w-32" />
                        <SkeletonBox className="h-64 w-full" />
                    </div>
                    
                    {/* Individual performance skeleton */}
                    <div className="space-y-3">
                        <SkeletonBox className="h-6 w-40" />
                        {[1, 2, 3, 4, 5].map((index) => (
                            <div key={index} className="flex justify-between items-center p-3 bg-neutral-200 dark:bg-neutral-700 rounded">
                                <SkeletonBox className="h-5 w-32" />
                                <SkeletonBox className="h-5 w-16" />
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                <>
                    {/* Summary stats section */}
                    <SummaryStats 
                        totalRatings={totalRatings} 
                        averageRatings={averageRatings} 
                        mostActiveUser={mostActiveUser} 
                    />
                      {/* Rating distribution charts */}
                    <RatingDistribution 
                        userRatings={userRatings} 
                        sortBy={sortBy} 
                        setSortBy={setSortBy as React.Dispatch<React.SetStateAction<string>>} 
                    />
                      {/* Activity Tracker section - NEW */}
                    <ActivityTracker clipTeamUsernames={clipTeamUsernames} />
                    
                    {/* Individual performance section */}
                    <IndividualPerformance 
                        sortedUsers={sortedUsers}
                        seasonInfo={seasonInfo}
                    />
                    
                    {/* Comparison chart section */}
                    <ComparisonChart 
                        sortedUsers={sortedUsers}
                        seasonInfo={seasonInfo}
                        totalRatings={totalRatings}
                    />
                    
                    {/* Empty message if no data */}
                    {userRatings.length === 0 && (
                        <div className="bg-neutral-200 dark:bg-neutral-700 p-6 rounded-lg text-center mt-4">
                            <p className="text-neutral-600 dark:text-neutral-400">
                                No rating data available. Team members need to rate clips to see statistics.
                            </p>
                        </div>
                    )}
                </>
            )}
        </motion.div>
    );
}

export default Statistics;
