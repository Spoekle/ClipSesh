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
    clipStats?: {
        totalClips: number;
        ratedClips: number;
        unratedClips: number;
        deniedClips: number;
    };
    loading?: boolean;
}

const Statistics: React.FC<StatisticsProps> = ({ clipTeam, userRatings, seasonInfo, clipStats, loading = false }) => {
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
    const clipTeamUsernames = clipTeam.map(member => member.username || '').filter(Boolean); return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="w-full space-y-6"
        >
            {/* Header Section */}
            <div className="bg-white/80 dark:bg-neutral-800/50 backdrop-blur-sm p-6 rounded-xl shadow-sm border border-neutral-200/80 dark:border-neutral-700/50">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-3.5 rounded-xl shadow-lg shadow-blue-500/20">
                            <FaChartBar className="text-white text-xl" />
                        </div>
                        <div>
                            <h2 className="text-2xl md:text-3xl font-bold text-neutral-900 dark:text-white">
                                Team Performance
                            </h2>
                            <p className="text-neutral-500 dark:text-neutral-400 mt-1">
                                Rating activity and progress insights
                            </p>
                        </div>
                    </div>

                    {/* Season Info */}
                    {seasonInfo.season && (
                        <div className="hidden md:block bg-neutral-100 dark:bg-neutral-700/50 px-4 py-2 rounded-lg border border-neutral-200 dark:border-neutral-600">
                            <div className="text-center">
                                <div className="text-xs text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">Season</div>
                                <div className="font-semibold text-neutral-800 dark:text-neutral-100 capitalize">
                                    {seasonInfo.season}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {loading ? (
                <div className="space-y-6">
                    {/* Summary stats skeleton */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {[1, 2, 3].map((index) => (
                            <div key={index} className="bg-white/80 dark:bg-neutral-800/50 backdrop-blur-sm p-6 rounded-xl border border-neutral-200/80 dark:border-neutral-700/50">
                                <SkeletonBox className="h-4 w-24 mb-3" />
                                <SkeletonBox className="h-8 w-16 mb-2" />
                                <SkeletonBox className="h-2 w-full" />
                            </div>
                        ))}
                    </div>

                    {/* Charts skeleton */}
                    <div className="space-y-6">
                        <div className="bg-white/80 dark:bg-neutral-800/50 backdrop-blur-sm p-6 rounded-xl border border-neutral-200/80 dark:border-neutral-700/50">
                            <SkeletonBox className="h-6 w-40 mb-4" />
                            <SkeletonBox className="h-80 w-full" />
                        </div>
                    </div>

                    {/* Individual performance skeleton */}
                    <div className="bg-white/80 dark:bg-neutral-800/50 backdrop-blur-sm p-6 rounded-xl border border-neutral-200/80 dark:border-neutral-700/50">
                        <SkeletonBox className="h-6 w-48 mb-6" />
                        <div className="space-y-3">
                            {[1, 2, 3, 4, 5].map((index) => (
                                <div key={index} className="flex justify-between items-center p-4 bg-neutral-100 dark:bg-neutral-700/50 rounded-lg">
                                    <SkeletonBox className="h-5 w-32" />
                                    <SkeletonBox className="h-5 w-16" />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            ) : (
                <>
                    {/* Summary stats section */}
                    {clipStats && (
                        <SummaryStats
                            totalRatings={totalRatings}
                            averageRatings={averageRatings}
                            mostActiveUser={mostActiveUser}
                            totalClips={clipStats.totalClips}
                            ratedClips={clipStats.ratedClips}
                            unratedClips={clipStats.unratedClips}
                            deniedClips={clipStats.deniedClips}
                        />
                    )}

                    {/* Rating distribution charts */}
                    <RatingDistribution
                        userRatings={userRatings}
                        sortBy={sortBy}
                        setSortBy={setSortBy as React.Dispatch<React.SetStateAction<string>>}
                    />

                    {/* Activity Tracker section */}
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

                    {/* Empty state */}
                    {userRatings.length === 0 && (
                        <div className="bg-white/80 dark:bg-neutral-800/50 backdrop-blur-sm p-8 rounded-xl text-center border border-neutral-200/80 dark:border-neutral-700/50">
                            <div className="bg-neutral-100 dark:bg-neutral-700/50 p-5 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                                <FaChartBar className="text-2xl text-neutral-400 dark:text-neutral-500" />
                            </div>
                            <h3 className="text-lg font-semibold text-neutral-800 dark:text-neutral-200 mb-2">
                                No Data Available
                            </h3>
                            <p className="text-neutral-500 dark:text-neutral-400 max-w-md mx-auto text-sm">
                                Team members need to start rating clips to see performance statistics here.
                            </p>
                        </div>
                    )}
                </>
            )}
        </motion.div>
    );
}

export default Statistics;
