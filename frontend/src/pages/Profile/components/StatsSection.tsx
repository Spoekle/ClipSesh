import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { motion } from 'framer-motion';
import {
    FaStar,
    FaPercentage,
    FaClipboard,
    FaChartPie,
    FaTrophy
} from 'react-icons/fa';
import { User, Clip, Rating } from '../../../types/adminTypes';
import { getCurrentSeason } from '../../../utils/seasonHelpers';
import { getClipsWithRatings } from '../../../services/clipService';
import apiUrl from '../../../config/config';
import axios from 'axios';
import RatedClips from './stats/RatedClips';
import ActivityTracker from './stats/ActivityTracker';

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
    const [ratings, setRatings] = useState<Record<string, Rating>>({});
    const [userStats, setUserStats] = useState<UserRatingData | null>(null);
    const [clipAmount, setClipAmount] = useState<number>(0);
    const [clips, setClips] = useState<Clip[]>([]);
    const [, setLoading] = useState(true);

    // Fetch data on mount and when view switches
    useEffect(() => {
        fetchData();
    }, [viewSwitchTimestamp]);

    const fetchData = async () => {
        try {
            setLoading(true);
            
            // Fetch clips and ratings
            const { clips: clipsData, ratings: ratingsData } = await getClipsWithRatings();
            setClips(clipsData);
            setRatings(ratingsData);

            // Fetch config for clip amount
            try {
                const response = await axios.get(`${apiUrl}/api/config`, {
                    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                });
                setClipAmount(response.data?.public?.clipAmount || Object.keys(ratingsData).length);
            } catch (error) {
                setClipAmount(Object.keys(ratingsData).length);
            }

            // Calculate user stats
            calculateUserStats(ratingsData);
            
        } catch (error) {
            console.error('Error fetching stats data:', error);
        } finally {
            setLoading(false);
        }
    };

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

    if (!userStats) {
        return (
            <motion.div 
                className="bg-white/80 dark:bg-neutral-800/80 backdrop-blur-sm rounded-xl shadow-md border border-neutral-200/50 dark:border-neutral-700/50 p-6">
                <p className="text-neutral-600 dark:text-neutral-400">No rating data available.</p>
            </motion.div>
        );
    }
    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#FF0000'];

    const chartData = [
        { name: 'Rated 1', value: userStats['1'], color: COLORS[0] },
        { name: 'Rated 2', value: userStats['2'], color: COLORS[1] },
        { name: 'Rated 3', value: userStats['3'], color: COLORS[2] },
        { name: 'Rated 4', value: userStats['4'], color: COLORS[3] },
        { name: 'Denied', value: userStats['deny'], color: COLORS[4] },
    ].filter(item => item.value > 0);

    // Calculate completion percentage
    const completionPercentage = clipAmount > 0 ? (userStats.total / clipAmount) * 100 : 0;

    const statCards = [
        {
            title: 'Total Ratings',
            value: userStats.total,
            icon: <FaClipboard className="text-blue-500" size={20} />,
            color: 'from-blue-500 to-blue-600'
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
            icon: <FaTrophy className="text-purple-500" size={20} />,
            color: 'from-purple-500 to-purple-600'
        }
    ];

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="space-y-6"
        >
            {/* Header */}
            <div className="bg-white/80 dark:bg-neutral-800/80 backdrop-blur-sm rounded-xl shadow-md border border-neutral-200/50 dark:border-neutral-700/50 p-4">
                <h2 className="text-xl font-bold text-neutral-900 dark:text-white mb-2 flex items-center">
                    <FaChartPie className="text-blue-500 mr-2" size={20} />
                    Rating Statistics
                </h2>
                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                    Your rating activity for {getCurrentSeason().season}
                </p>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {statCards.map((stat, index) => (
                    <motion.div
                        key={stat.title}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="bg-white/80 dark:bg-neutral-800/80 backdrop-blur-sm rounded-xl shadow-md border border-neutral-200/50 dark:border-neutral-700/50 p-4"
                    >
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-medium text-neutral-600 dark:text-neutral-400 uppercase tracking-wider">
                                {stat.title}
                            </span>
                            {stat.icon}
                        </div>
                        <div className="text-2xl font-bold text-neutral-900 dark:text-white">
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
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                        className="bg-white/80 dark:bg-neutral-800/80 backdrop-blur-sm rounded-xl shadow-md border border-neutral-200/50 dark:border-neutral-700/50 p-4"
                    >
                        <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4">
                            Rating Distribution
                        </h3>
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie
                                    data={chartData}
                                    cx="50%"
                                    cy="50%"
                                    outerRadius={80}
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
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                    className="bg-white/80 dark:bg-neutral-800/80 backdrop-blur-sm rounded-xl shadow-md border border-neutral-200/50 dark:border-neutral-700/50 p-4"
                >
                    <ActivityTracker viewSwitchTimestamp={viewSwitchTimestamp} />
                </motion.div>
            </div>

            {/* Rated Clips */}
            {clips.length > 0 && Object.keys(ratings).length > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="bg-white/80 dark:bg-neutral-800/80 backdrop-blur-sm rounded-xl shadow-md border border-neutral-200/50 dark:border-neutral-700/50 p-4"
                >
                    <h2 className="text-lg font-bold mb-4 flex items-center text-neutral-900 dark:text-white">
                        <FaClipboard className="text-indigo-500 mr-2" size={16} />
                        Your Rated Clips
                    </h2>
                    <RatedClips ratingsData={ratings} clipsData={clips} />
                </motion.div>
            )}
        </motion.div>
    );
};

export default StatsSection;
