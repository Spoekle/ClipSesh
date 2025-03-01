import React, { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { motion } from 'framer-motion';
import { 
  FaChartBar, 
  FaChartPie, 
  FaCheck, 
  FaTimes, 
  FaStar, 
  FaUserAlt, 
  FaFilter,
  FaAngleDown,
  FaAngleUp
} from 'react-icons/fa';

const Statistics = ({ clipTeam, userRatings, seasonInfo }) => {
    const [activeChart, setActiveChart] = useState('bar');
    const [sortBy, setSortBy] = useState('rating');
    const [expandedUsers, setExpandedUsers] = useState({});
    const [isPerformanceExpanded, setIsPerformanceExpanded] = useState(false);
    const [isComparisonExpanded, setIsComparisonExpanded] = useState(false);
    
    // Function to toggle user details expansion
    const toggleUserExpand = (username) => {
        setExpandedUsers(prev => ({
            ...prev,
            [username]: !prev[username]
        }));
    };
    
    // Calculate overall stats for team
    const totalRatings = userRatings.reduce((acc, user) => acc + user.total, 0);
    const averageRatings = totalRatings / userRatings.length || 0;
    const mostActiveUser = [...userRatings].sort((a, b) => b.total - a.total)[0]?.username || 'No data';
    
    // Prepare data for pie chart
    const pieData = userRatings.reduce((acc, user) => {
        ['1', '2', '3', '4', 'deny'].forEach(rating => {
            const existingIndex = acc.findIndex(item => item.name === `Rated ${rating === 'deny' ? 'Deny' : rating}`);
            if (existingIndex >= 0) {
                acc[existingIndex].value += user[rating];
            } else {
                acc.push({
                    name: `Rated ${rating === 'deny' ? 'Deny' : rating}`,
                    value: user[rating]
                });
            }
        });
        return acc;
    }, []);
    
    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#FF0000'];
    
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
    
    // Enhanced tooltip for the bar chart
    const CustomBarTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            const userData = payload[0].payload;
            
            return (
                <div className="p-4 bg-neutral-800 shadow-lg rounded-lg border border-neutral-700">
                    <h3 className="text-lg font-bold text-white mb-2">{userData.username}</h3>
                    <div className="space-y-1">
                        <p className="text-sm text-white flex justify-between">
                            <span>Total Ratings:</span> 
                            <span className="font-semibold">{userData.total}</span>
                        </p>
                        <p className="text-sm text-white flex justify-between">
                            <span>Coverage:</span> 
                            <span className="font-semibold">{userData.percentageRated.toFixed(1)}%</span>
                        </p>
                        <div className="mt-2 pt-2 border-t border-neutral-700">
                            <div className="grid grid-cols-2 gap-2">
                                {['1', '2', '3', '4', 'deny'].map(rating => (
                                    <p key={rating} className="text-xs flex justify-between">
                                        <span className="text-neutral-400">Rated {rating}:</span>
                                        <span>{userData[rating]}</span>
                                    </p>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            );
        }
        return null;
    };
    
    // Enhanced tooltip for the pie chart
    const CustomPieTooltip = ({ active, payload }) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;
            return (
                <div className="p-3 bg-neutral-800 shadow-lg rounded-lg border border-neutral-700">
                    <p className="font-medium text-white">{data.name}</p>
                    <p className="text-sm">
                        <span className="text-neutral-300">Count: </span>
                        <span className="font-semibold text-white">{data.value}</span>
                    </p>
                    <p className="text-sm">
                        <span className="text-neutral-300">Percentage: </span>
                        <span className="font-semibold text-white">
                            {((data.value / pieData.reduce((acc, item) => acc + item.value, 0)) * 100).toFixed(1)}%
                        </span>
                    </p>
                </div>
            );
        }
        return null;
    };

    return (
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
            
            {/* Summary stats section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <motion.div 
                    whileHover={{ scale: 1.02 }}
                    className="bg-gradient-to-br from-neutral-200 to-neutral-300 dark:from-blue-900/20 dark:to-blue-800/40 p-5 rounded-lg shadow"
                >
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-sm uppercase tracking-wide font-medium text-neutral-600 dark:text-neutral-400">Total Ratings</p>
                            <h3 className="text-3xl font-bold mt-1">{totalRatings}</h3>
                        </div>
                        <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                            <FaStar className="text-blue-600 dark:text-blue-400" size={24} />
                        </div>
                    </div>
                </motion.div>
                
                <motion.div 
                    whileHover={{ scale: 1.02 }}
                    className="bg-gradient-to-br from-neutral-200 to-neutral-300 dark:from-green-900/20 dark:to-green-800/40 p-5 rounded-lg shadow"
                >
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-sm uppercase tracking-wide font-medium text-neutral-600 dark:text-neutral-400">Avg. Ratings per Member</p>
                            <h3 className="text-3xl font-bold mt-1">{averageRatings.toFixed(0)}</h3>
                        </div>
                        <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
                            <FaUserAlt className="text-green-600 dark:text-green-400" size={24} />
                        </div>
                    </div>
                </motion.div>
                
                <motion.div 
                    whileHover={{ scale: 1.02 }}
                    className="bg-gradient-to-br from-neutral-200 to-neutral-300 dark:from-purple-900/20 dark:to-purple-800/40 p-5 rounded-lg shadow"
                >
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="text-sm uppercase tracking-wide font-medium text-neutral-600 dark:text-neutral-400">Most Active Member</p>
                            <h3 className="text-3xl font-bold mt-1 truncate max-w-[200px]">{mostActiveUser}</h3>
                        </div>
                        <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                            <FaCheck className="text-purple-600 dark:text-purple-400" size={24} />
                        </div>
                    </div>
                </motion.div>
            </div>
            
            {/* Chart controls */}
            <div className="flex flex-wrap justify-between mb-6">
                <div className="flex space-x-2 mb-4">
                    <button
                        onClick={() => setActiveChart('bar')}
                        className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
                            activeChart === 'bar'
                                ? 'bg-blue-600 text-white'
                                : 'bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-200'
                        } transition-colors`}
                    >
                        <FaChartBar /> Bar Chart
                    </button>
                    <button
                        onClick={() => setActiveChart('pie')}
                        className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
                            activeChart === 'pie'
                                ? 'bg-blue-600 text-white'
                                : 'bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-200'
                        } transition-colors`}
                    >
                        <FaChartPie /> Pie Chart
                    </button>
                </div>
                
                <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium hidden sm:block">Sort by:</span>
                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="px-3 py-2 rounded-lg bg-neutral-200 dark:bg-neutral-700 text-neutral-800 dark:text-white border-none focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    >
                        <option value="username">Username</option>
                        <option value="rating">Total Ratings</option>
                        <option value="percentage">Percentage</option>
                    </select>
                </div>
            </div>
            
            {/* Chart visualization */}
            <div className="bg-neutral-200 dark:bg-neutral-700 rounded-xl p-4 md:p-6 shadow-inner mb-8">
                <ResponsiveContainer width="100%" height={400} className="mt-4">
                    {activeChart === 'bar' ? (
                        <BarChart data={sortedUsers} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#555" />
                            <XAxis 
                                dataKey="username" 
                                angle={-45}
                                textAnchor="end"
                                height={70}
                                tick={{ fill: '#888', fontSize: 12 }}
                            />
                            <YAxis tick={{ fill: '#888' }} />
                            <Tooltip content={<CustomBarTooltip />} />
                            <Legend />
                            <Bar name="Total Ratings" dataKey="total" fill="#3b82f6" />
                        </BarChart>
                    ) : (
                        <PieChart>
                            <Pie
                                data={pieData}
                                cx="50%"
                                cy="50%"
                                labelLine={true}
                                outerRadius={130}
                                fill="#8884d8"
                                dataKey="value"
                                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                            >
                                {pieData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip content={<CustomPieTooltip />} />
                            <Legend />
                        </PieChart>
                    )}
                </ResponsiveContainer>
            </div>
            
            {/* Individual Performance Section Header - Clickable */}
            <div 
                onClick={() => setIsPerformanceExpanded(!isPerformanceExpanded)}
                className="flex justify-between items-center mt-10 mb-4 cursor-pointer group"
            >
                <h3 className="text-xl font-bold flex items-center">
                    <FaUserAlt className="mr-2 text-blue-500" /> 
                    Individual Performance Stats
                </h3>
                <div className="bg-neutral-200 dark:bg-neutral-700 p-2 rounded-full transform transition-transform duration-200 group-hover:bg-neutral-300 dark:group-hover:bg-neutral-600">
                    {isPerformanceExpanded ? (
                        <FaAngleUp className="text-neutral-600 dark:text-neutral-300" />
                    ) : (
                        <FaAngleDown className="text-neutral-600 dark:text-neutral-300" />
                    )}
                </div>
            </div>
            
            {/* Individual Performance Content - Collapsible */}
            <motion.div 
                initial={false}
                animate={{ 
                    height: isPerformanceExpanded ? "auto" : 0,
                    opacity: isPerformanceExpanded ? 1 : 0
                }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
            >
                <div className="space-y-3">
                    {sortedUsers.map(user => {
                        const isExpanded = expandedUsers[user.username] || false;
                        const userRatingPercentage = user.percentageRated;
                        let barColor;
                        
                        if (userRatingPercentage >= 90) barColor = "bg-green-500";
                        else if (userRatingPercentage >= 75) barColor = "bg-blue-500";
                        else if (userRatingPercentage >= 50) barColor = "bg-yellow-500";
                        else if (userRatingPercentage >= 25) barColor = "bg-orange-500";
                        else barColor = "bg-red-500";
                        
                        return (
                            <motion.div
                                key={user.username}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-neutral-200 dark:bg-neutral-700 rounded-lg overflow-hidden"
                            >
                                <div 
                                    className="flex justify-between items-center p-4 cursor-pointer hover:bg-neutral-300 dark:hover:bg-neutral-600 transition-colors"
                                    onClick={() => toggleUserExpand(user.username)}
                                >
                                    <div className="flex items-center">
                                        <div className="mr-3 w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold">
                                            {user.username.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <h4 className="font-semibold">{user.username}</h4>
                                            <div className="text-sm text-neutral-600 dark:text-neutral-400">
                                                {user.total} ratings ({userRatingPercentage.toFixed(1)}%)
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="flex items-center gap-3">
                                        <span className={`flex items-center text-sm px-2 py-0.5 rounded ${
                                            userRatingPercentage > 20 ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200' 
                                                                    : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200'
                                        }`}>
                                            {userRatingPercentage > 20 ? <FaCheck className="mr-1" /> : <FaTimes className="mr-1" />}
                                            {userRatingPercentage > 20 ? 'Compliant' : 'Non-compliant'}
                                        </span>
                                        {isExpanded ? <FaAngleUp /> : <FaAngleDown />}
                                    </div>
                                </div>
                                
                                {isExpanded && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: "auto" }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="px-4 pb-4"
                                    >
                                        <div className="p-4 rounded-lg bg-neutral-300 dark:bg-neutral-800">
                                            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
                                                {[
                                                    { label: 'Rated 1', value: user['1'], color: COLORS[0] },
                                                    { label: 'Rated 2', value: user['2'], color: COLORS[1] },
                                                    { label: 'Rated 3', value: user['3'], color: COLORS[2] },
                                                    { label: 'Rated 4', value: user['4'], color: COLORS[3] },
                                                    { label: 'Denied', value: user['deny'], color: COLORS[4] }
                                                ].map((item, index) => (
                                                    <div key={index} className="bg-neutral-400 dark:bg-neutral-700 text-neutral-900 dark:text-white transition duration-200 rounded-md p-3">
                                                        <div className="flex justify-between items-center">
                                                            <span className="text-sm font-medium">{item.label}:</span>
                                                            <span className="font-bold" style={{ color: item.color }}>{item.value}</span>
                                                        </div>
                                                        <div className="mt-1 w-full bg-neutral-500 dark:bg-neutral-800 h-1.5 rounded-full overflow-hidden">
                                                            <div 
                                                                className="h-full" 
                                                                style={{ 
                                                                    width: `${(item.value / user.total) * 100 || 0}%`,
                                                                    backgroundColor: item.color 
                                                                }}
                                                            />
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>

                                            {/* Rating distribution mini pie chart */}
                                            <div className="mt-6 mb-2">
                                                <h4 className="font-medium mb-2 text-sm uppercase tracking-wide">Rating Distribution</h4>
                                                <div className="flex items-center">
                                                    <div className="w-1/2 h-32">
                                                        <ResponsiveContainer width="100%" height="100%">
                                                            <PieChart>
                                                                <Pie
                                                                    data={[
                                                                        { name: 'Rated 1', value: user['1'] },
                                                                        { name: 'Rated 2', value: user['2'] },
                                                                        { name: 'Rated 3', value: user['3'] },
                                                                        { name: 'Rated 4', value: user['4'] },
                                                                        { name: 'Denied', value: user['deny'] }
                                                                    ]}
                                                                    cx="50%"
                                                                    cy="50%"
                                                                    innerRadius={25}
                                                                    outerRadius={45}
                                                                    fill="#8884d8"
                                                                    dataKey="value"
                                                                    paddingAngle={3}
                                                                >
                                                                    {pieData.map((entry, index) => (
                                                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                                    ))}
                                                                </Pie>
                                                            </PieChart>
                                                        </ResponsiveContainer>
                                                    </div>

                                                    <div className="w-1/2">
                                                        <div className="flex flex-col gap-1 text-sm">
                                                            <div className="flex justify-between">
                                                                <span>Completion:</span>
                                                                <span className="font-semibold">{userRatingPercentage.toFixed(1)}%</span>
                                                            </div>
                                                            <div className="flex justify-between">
                                                                <span>Total Clips Rated:</span>
                                                                <span className="font-semibold">{user.total} of {seasonInfo.clipAmount}</span>
                                                            </div>
                                                            <div className="flex justify-between">
                                                                <span>Remaining:</span>
                                                                <span className="font-semibold">{seasonInfo.clipAmount - user.total} clips</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Progress bar */}
                                            <div className="mt-4">
                                                <div className="flex justify-between items-center mb-1">
                                                    <span className="text-sm font-medium">Rating Progress</span>
                                                    <span className="text-xs font-medium text-neutral-600 dark:text-neutral-400">
                                                        {user.total}/{seasonInfo.clipAmount} clips
                                                    </span>
                                                </div>
                                                <div className="w-full h-2 bg-neutral-400 dark:bg-neutral-600 rounded-full overflow-hidden">
                                                    <motion.div 
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${(user.total / seasonInfo.clipAmount) * 100 || 0}%` }}
                                                        transition={{ duration: 0.8, delay: 0.2 }}
                                                        className={`h-full ${barColor}`}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </motion.div>
                        );
                    })}
                </div>
            </motion.div>

            {/* Comparison Section Header - Clickable */}
            <div 
                onClick={() => setIsComparisonExpanded(!isComparisonExpanded)}
                className="flex justify-between items-center mt-10 mb-4 cursor-pointer group"
            >
                <h3 className="text-xl font-bold flex items-center">
                    <FaChartBar className="mr-2 text-green-500" /> 
                    Rating Completion Comparison
                </h3>
                <div className="bg-neutral-200 dark:bg-neutral-700 p-2 rounded-full transform transition-transform duration-200 group-hover:bg-neutral-300 dark:group-hover:bg-neutral-600">
                    {isComparisonExpanded ? (
                        <FaAngleUp className="text-neutral-600 dark:text-neutral-300" />
                    ) : (
                        <FaAngleDown className="text-neutral-600 dark:text-neutral-300" />
                    )}
                </div>
            </div>
            
            {/* Comparison Section Content - Collapsible */}
            <motion.div 
                initial={false}
                animate={{ 
                    height: isComparisonExpanded ? "auto" : 0,
                    opacity: isComparisonExpanded ? 1 : 0
                }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
            >
                <div className="bg-neutral-200 dark:bg-neutral-700 p-4 md:p-6 rounded-xl shadow-inner w-full">
                    <div className="w-full" style={{ height: 300 }}>
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart 
                                data={sortedUsers.map(user => ({
                                    ...user,
                                    remaining: seasonInfo.clipAmount - user.total
                                }))}
                                margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                                layout="vertical"
                            >
                                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                                <XAxis 
                                    type="number" 
                                    domain={[0, seasonInfo.clipAmount]} 
                                    tickCount={Math.min(6, seasonInfo.clipAmount)} 
                                    tick={{ fill: '#888' }}
                                    label={{ 
                                        value: 'Clips', 
                                        position: 'insideBottom',
                                        offset: -10,
                                        fill: '#888' 
                                    }}
                                />
                                <YAxis 
                                    dataKey="username" 
                                    type="category" 
                                    tick={{ fill: '#888', fontSize: 12 }}
                                    width={100}
                                />
                                <Tooltip 
                                    formatter={(value, name, entry) => {
                                        if (name === 'Completed') {
                                            return [`${value} clips rated`, name];
                                        } else {
                                            return [`${value} clips remaining`, name];
                                        }
                                    }}
                                    labelFormatter={(value) => `${value}'s Progress`}
                                />
                                <Legend />
                                <Bar 
                                    name="Completed" 
                                    dataKey="total" 
                                    stackId="a" 
                                    fill="#4ade80"
                                />
                                <Bar 
                                    name="Remaining" 
                                    dataKey="remaining" 
                                    stackId="a" 
                                    fill="#d1d5db"
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                    
                    {/* Add summary below the chart */}
                    <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-neutral-300 dark:bg-neutral-600 p-3 rounded-lg">
                            <div className="font-medium text-center">Total Clips</div>
                            <div className="text-2xl font-bold text-center">{seasonInfo.clipAmount}</div>
                        </div>
                        <div className="bg-green-100 dark:bg-green-900/30 p-3 rounded-lg">
                            <div className="font-medium text-center text-green-700 dark:text-green-300">Team Coverage</div>
                            <div className="text-2xl font-bold text-center text-green-700 dark:text-green-300">
                                {((totalRatings / (sortedUsers.length * seasonInfo.clipAmount)) * 100).toFixed(1)}%
                            </div>
                        </div>
                        <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-lg">
                            <div className="font-medium text-center text-blue-700 dark:text-blue-300">Average Completion</div>
                            <div className="text-2xl font-bold text-center text-blue-700 dark:text-blue-300">
                                {sortedUsers.length > 0 
                                    ? ((sortedUsers.reduce((acc, user) => acc + user.percentageRated, 0) / sortedUsers.length)).toFixed(1) 
                                    : 0}%
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>
            
            {/* Empty message if no data */}
            {userRatings.length === 0 && (
                <div className="bg-neutral-200 dark:bg-neutral-700 p-6 rounded-lg text-center mt-4">
                    <p className="text-neutral-600 dark:text-neutral-400">
                        No rating data available. Team members need to rate clips to see statistics.
                    </p>
                </div>
            )}
        </motion.div>
    );
}

export default Statistics;
