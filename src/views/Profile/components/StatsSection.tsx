import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { motion } from 'framer-motion';
import {
    FaStar,
    FaPercentage,
    FaClipboard,
    FaChartPie,
    FaCheckCircle
} from 'react-icons/fa';
import { User, Rating } from '../../../types/adminTypes';
import { getCurrentSeason } from '../../../utils/seasonHelpers';
import RatedClips from './stats/RatedClips';
import ActivityTracker from './stats/ActivityTracker';

import { useClipsWithRatings } from '../../../hooks/useClips';
import { useCombinedConfig } from '../../../hooks/useConfig';

interface UserRatingData {
    username: string;
    '1': number;
    '2': number;
    '3': number;
    '4': number;
    'deny': number;
    total: number;
}

interface StatsSectionProps {
    user: User;
    viewSwitchTimestamp?: number;
}

const StatsSection: React.FC<StatsSectionProps> = ({ user, viewSwitchTimestamp }) => {
    const { data: clipsData, isLoading: clipsLoading, refetch: refetchClips } = useClipsWithRatings();
    const { data: configData, isLoading: configLoading } = useCombinedConfig(user);
    
    const clips = clipsData?.clips || [];
    const ratings = clipsData?.ratings || {};
    const clipAmount = configData?.public?.clipAmount || Object.keys(ratings).length;
    const isLoading = clipsLoading || configLoading;
    
    const [userStats, setUserStats] = useState<UserRatingData | null>(null);

    useEffect(() => {
        if (viewSwitchTimestamp) {
            refetchClips();
        }
    }, [viewSwitchTimestamp, refetchClips]);

    useEffect(() => {
        if (ratings && Object.keys(ratings).length > 0) {
            calculateUserStats(ratings);
        }
    }, [ratings]);

    const calculateUserStats = (ratingsData: Record<string, Rating>) => {        const stats: UserRatingData = {
            username: user.username,
            '1': 0,
            '2': 0,
            '3': 0,
            '4': 0,
            'deny': 0,
            total: 0
        };

        Object.values(ratingsData).forEach(rating => {
            if (Array.isArray(rating.ratingCounts)) {
                rating.ratingCounts.forEach(ratingData => {
                    if (Array.isArray(ratingData.users)) {
                        ratingData.users.forEach(ratingUser => {
                            if (ratingUser.username === user.username) {
                                const ratingValue = ratingData.rating as keyof UserRatingData;
                                if (typeof stats[ratingValue] === 'number') {
                                    (stats[ratingValue] as number)++;
                                    stats.total++;
                                }
                            }
                        });
                    }
                });
            }        });

        setUserStats(stats);
    };

    if (isLoading) {
        return (
            <motion.div 
                className="bg-[#161d21] rounded-[10px] border border-[#263238] p-6">
                <p className="text-[#b3b3b3]">Loading statistics...</p>
            </motion.div>
        );
    }

    if (!userStats) {
        return (
            <motion.div 
                className="bg-[#161d21] rounded-[10px] border border-[#263238] p-6">
                <p className="text-[#b3b3b3]">No rating data available.</p>
            </motion.div>
        );
    }
    const COLORS = ['#f23030', '#00C49F', '#FFBB28', '#FF8042', '#c51f1f'];

    const chartData = [
        { name: 'Rated 1', value: userStats['1'], color: COLORS[0] },
        { name: 'Rated 2', value: userStats['2'], color: COLORS[1] },
        { name: 'Rated 3', value: userStats['3'], color: COLORS[2] },
        { name: 'Rated 4', value: userStats['4'], color: COLORS[3] },
        { name: 'Denied', value: userStats['deny'], color: COLORS[4] },
    ].filter(item => item.value > 0);

    const completionPercentage = clipAmount > 0 ? (userStats.total / clipAmount) * 100 : 0;

    const statCards = [
        {
            title: 'Total Ratings',
            value: userStats.total,
            icon: <FaClipboard className="text-[#f23030]" size={20} />,
            color: 'from-[#f23030] to-[#c51f1f]'
        },
        {
            title: 'Progress',
            value: `${completionPercentage.toFixed(1)}%`,
            icon: <FaPercentage className="text-green-500" size={20} />,
            color: 'from-green-500 to-green-600'
        },
        {
            title: 'Most Given',
            value: ['1', '2', '3', '4', 'deny'].reduce((a, b) => 
                (userStats[a as keyof UserRatingData] as number) > (userStats[b as keyof UserRatingData] as number) ? a : b
            ),
            icon: <FaStar className="text-yellow-500" size={20} />,
            color: 'from-yellow-500 to-yellow-600'
        },
        {
            title: 'Completion',
            value: completionPercentage === 100 ? 'Complete' : 'In Progress',
            icon: <FaCheckCircle className="text-purple-500" size={20} />,
            color: 'from-purple-500 to-purple-600'
        }
    ];

    return (
        <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="space-y-6"
        >
            {/* Header */}
            <div className="bg-[#161d21] rounded-[10px] border border-[#263238] p-5">
                <h2 className="text-base font-bold text-[#e6e6e6] mb-1 flex items-center gap-2.5">
                    <div className="w-8 h-8 bg-[#f23030]/10 text-[#f23030] rounded-[8px] flex items-center justify-center">
                        <FaChartPie size={14} />
                    </div>
                    <span>Rating Statistics</span>
                </h2>
                <p className="text-xs text-[#626262] pl-10">
                    Your rating activity for {getCurrentSeason().season}
                </p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {statCards.map((stat, index) => (
                    <motion.div
                        key={stat.title}
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="rounded-[10px] border border-[#263238] p-4 bg-[#0e1315]"
                    >
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-[11px] font-semibold text-[#626262] uppercase tracking-wider">
                                {stat.title}
                            </span>
                            {stat.icon}
                        </div>
                        <div className="text-2xl font-bold text-[#e6e6e6]">
                            {stat.value}
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Charts and Activity */}
            <div className="grid lg:grid-cols-2 gap-6">
                {/* Rating Distribution Chart */}
                {chartData.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, x: -15 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.15 }}
                        className="bg-[#161d21] rounded-[10px] border border-[#263238] p-5"
                    >
                        <h3 className="text-sm font-bold uppercase tracking-wider text-[#b3b3b3] mb-4">
                            Rating Distribution
                        </h3>
                        <ResponsiveContainer width="100%" height={280}>
                            <PieChart>
                                <Pie
                                    data={chartData}
                                    cx="50%"
                                    cy="50%"
                                    outerRadius={75}
                                    fill="#8884d8"
                                    dataKey="value"
                                    label={({ name, value }) => `${name}: ${value}`}
                                >
                                    {chartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend />
                            </PieChart>
                        </ResponsiveContainer>
                    </motion.div>
                )}

                {/* Activity Tracker */}
                <motion.div
                    initial={{ opacity: 0, x: 15 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-[#161d21] rounded-[10px] border border-[#263238] p-5"
                >
                    <ActivityTracker viewSwitchTimestamp={viewSwitchTimestamp} />
                </motion.div>
            </div>

            {/* Rated Clips */}
            {clips.length > 0 && Object.keys(ratings).length > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.25 }}
                    className="bg-[#161d21] rounded-[10px] border border-[#263238] p-5"
                >
                    <h2 className="text-sm font-bold uppercase tracking-wider mb-4 flex items-center gap-2 text-[#e6e6e6]">
                        <div className="w-7 h-7 bg-[#f23030]/10 text-[#f23030] rounded-[8px] flex items-center justify-center">
                            <FaClipboard size={13} />
                        </div>
                        <span>Your Rated Clips</span>
                    </h2>
                    <RatedClips ratingsData={ratings} clipsData={clips} />
                </motion.div>
            )}
        </motion.div>
    );
};

export default StatsSection;
