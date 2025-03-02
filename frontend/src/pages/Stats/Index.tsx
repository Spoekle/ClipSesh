import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import axios from 'axios';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import LoadingBar from 'react-top-loading-bar';
import RatedClips from './components/RatedClips';
import apiUrl from '../../config/config';
import { motion } from 'framer-motion';
import { 
  FaStar, 
  FaPercentage, 
  FaClipboard,
  FaChartPie,
  FaTrophy,
  FaRegLightbulb
} from 'react-icons/fa';
import PageLayout from '../components/layouts/PageLayout';
import { User } from '../../types/adminTypes';

interface StatsProps {
  user: User;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
}

const Stats: React.FC<StatsProps> = ({ user, setUser }) => {
  const [progress, setProgress] = useState(0);
  const [ratings, setRatings] = useState({});
  const [userRatings, setUserRatings] = useState([]);
  const [seasonInfo, setSeasonInfo] = useState({});
  const [clips, setClips] = useState([]);

  const location = useLocation();

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      getSeason();
      setProgress(50);
      await fetchClipsAndRatings();
      setProgress(100);
    } catch (error) {
      console.error('Error fetching initial data:', error);
    }
  };

  const fetchClipsAndRatings = async () => {
    try {
      const clipResponse = await axios.get(`${apiUrl}/api/clips`);
      setClips(clipResponse.data);
      const token = localStorage.getItem('token');
      if (token) {
        const ratingPromises = clipResponse.data.map(clip =>
          axios.get(`${apiUrl}/api/ratings/${clip._id}`, {
            headers: { Authorization: `Bearer ${token}` }
          })
        );
        const ratingResponses = await Promise.all(ratingPromises);
        const ratingsData = ratingResponses.reduce((acc, res, index) => {
          acc[clipResponse.data[index]._id] = res.data;
          return acc;
        }, {});
        setRatings(ratingsData);
      }
    } catch (error) {
      console.error('Error fetching clips and ratings:', error);
    }
  };

  useEffect(() => {
    if (Object.keys(ratings).length > 0) {
      countRatingsLoggedIn();
    }
  }, [ratings]);

  const countRatingsLoggedIn = () => {
    const userRatingCount = {};

    const clipLength = Object.keys(ratings).length;
    setSeasonInfo(prevSeasonInfo => ({
      ...prevSeasonInfo,
      clipAmount: clipLength
    }));

    Object.keys(ratings).forEach(clipId => {
      const clipRatingCounts = ratings[clipId].ratingCounts;

      // Check if clipRatingCounts is an array
      if (!Array.isArray(clipRatingCounts)) {
        console.error(`clipRatingCounts for Clip ID ${clipId} is not an array:`, clipRatingCounts);
        return;
      }

      // Loop through each rating count entry in the array
      clipRatingCounts.forEach(ratingData => {
        if (ratingData.users && ratingData.users.length > 0) {
          // Iterate over the users who rated this clip
          ratingData.users.forEach(ratingUser => {
            if (ratingUser.username === user.username) {
              if (!userRatingCount[user.username]) {
                userRatingCount[user.username] = { '1': 0, '2': 0, '3': 0, '4': 0, 'deny': 0, total: 0 };
              }
              if (userRatingCount[user.username][ratingData.rating] !== undefined) {
                userRatingCount[user.username][ratingData.rating]++;
                userRatingCount[user.username].total++;
              } else {
                console.error(`Unknown rating type: ${ratingData.rating}`);
              }
              userRatingCount[user.username].percentageRated = (userRatingCount[user.username].total / clipLength) * 100;

            }
          });
        }
      });
    });


    // Convert userRatingCount object into an array of objects with username and rating counts
    const userRatingCounts = Object.keys(userRatingCount).map(username => ({
      username,
      ...userRatingCount[username]
    }));

    // Sort userRatingCounts by total count in descending order
    userRatingCounts.sort((a, b) => b.total - a.total);

    setUserRatings(userRatingCounts);
  };

  const getSeason = () => {
    const currentDate = new Date().toLocaleDateString();
    let season = '';

    if (currentDate >= '12-21' || currentDate <= '03-19') {
      season = 'Winter';
    } else if (currentDate >= '03-20' && currentDate <= '06-20') {
      season = 'Spring';
    } else if (currentDate >= '06-21' && currentDate <= '09-21') {
      season = 'Summer';
    } else {
      season = 'Fall';
    }

    setSeasonInfo(prevSeasonInfo => ({
      ...prevSeasonInfo,
      season
    }));
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#FF0000'];

  const combinedRatings = [
    { name: 'Rated 1', value: userRatings.reduce((acc, user) => acc + user['1'], 0) },
    { name: 'Rated 2', value: userRatings.reduce((acc, user) => acc + user['2'], 0) },
    { name: 'Rated 3', value: userRatings.reduce((acc, user) => acc + user['3'], 0) },
    { name: 'Rated 4', value: userRatings.reduce((acc, user) => acc + user['4'], 0) },
    { name: 'Denied', value: userRatings.reduce((acc, user) => acc + user['deny'], 0) },
  ];

  // Function to get an inspirational message based on rating percentage
  const getInspirationMessage = (percentage) => {
    if (percentage === 100) {
      return {
        title: "Perfect Score!",
        message: "You've rated every clip on ClipSesh. Amazing dedication!",
        icon: <FaTrophy className="text-yellow-500" size={30} />
      };
    } else if (percentage > 75) {
      return {
        title: "Incredible Progress!",
        message: "Almost there! You've rated over 75% of all clips.",
        icon: <FaStar className="text-blue-500" size={30} />
      };
    } else if (percentage > 50) {
      return {
        title: "Halfway Champion!",
        message: "You've rated more than half of all clips. Keep up the good work!",
        icon: <FaChartPie className="text-green-500" size={30} />
      };
    } else if (percentage > 20) {
      return {
        title: "Good Progress!",
        message: "You're on your way! Keep rating to help the community.",
        icon: <FaRegLightbulb className="text-amber-500" size={30} />
      };
    } else {
      return {
        title: "Just Getting Started!",
        message: "There are many more clips waiting for your ratings!",
        icon: <FaRegLightbulb className="text-red-400" size={30} />
      };
    }
  };

  return (
    <PageLayout
      title="Stats Dashboard"
      subtitle={`See your contribution, ${user.username}`}
      backgroundImage={user.profilePicture}
      metaDescription={`${user.username}'s clip rating statistics and progress on ClipSesh`}
    >
      <LoadingBar color='#3b82f6' height="4px" progress={progress} onLoaderFinished={() => setProgress(0)} />
      
      {userRatings.length > 0 && userRatings.map(userData => {
        const inspiration = getInspirationMessage(userData.percentageRated);
        
        return (
          <motion.div 
            key={userData.username}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="w-full p-6 md:p-8 mb-8 bg-neutral-300 dark:bg-neutral-800 text-neutral-900 dark:text-white transition duration-200 rounded-xl shadow-lg hover:shadow-xl"
          >
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 border-b border-neutral-400 dark:border-neutral-700 pb-4">
              <h2 className="text-3xl font-bold flex items-center">
                {inspiration.icon}
                <span className="ml-3">{inspiration.title}</span>
              </h2>
              <div className="px-4 py-2 bg-neutral-200 dark:bg-neutral-700 rounded-lg">
                <span className="font-medium">Season: </span>
                <span className="font-bold text-blue-600 dark:text-blue-400">{seasonInfo.season}</span>
              </div>
            </div>
            
            <div className="mb-8">
              <div className="p-5 bg-gradient-to-br from-neutral-200 to-neutral-300 dark:from-neutral-700/50 dark:to-neutral-600/50 rounded-lg shadow-inner mb-4">
                <p className="text-xl text-center font-medium">{inspiration.message}</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
                {/* Clips rated */}
                <motion.div 
                  whileHover={{ scale: 1.03, y: -5 }}
                  transition={{ type: "spring", stiffness: 300 }}
                  className="p-5 bg-gradient-to-br from-neutral-200 to-neutral-300 dark:from-blue-900/20 dark:to-blue-800/40 rounded-lg shadow relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-20 h-20 -mt-8 -mr-8 rounded-full bg-blue-500/20 dark:bg-blue-500/10"></div>
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm uppercase tracking-wider text-neutral-600 dark:text-neutral-400 mb-1">Total Clips Rated</p>
                      <h3 className="text-3xl font-bold">{userData.total}</h3>
                      <div className="mt-2 flex items-center">
                        <FaStar className="text-amber-500 mr-1" size={16} />
                        <span className="text-sm font-medium">of {seasonInfo.clipAmount} available</span>
                      </div>
                    </div>
                    <div className="p-3 bg-blue-100 dark:bg-blue-900/40 rounded-lg">
                      <FaStar className="text-blue-600 dark:text-blue-400" size={24} />
                    </div>
                  </div>
                </motion.div>

                {/* Percentage rated */}
                <motion.div 
                  whileHover={{ scale: 1.03, y: -5 }}
                  transition={{ type: "spring", stiffness: 300 }}
                  className="p-5 bg-gradient-to-br from-neutral-200 to-neutral-300 dark:from-green-900/20 dark:to-green-800/40 rounded-lg shadow relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-20 h-20 -mt-8 -mr-8 rounded-full bg-green-500/20 dark:bg-green-500/10"></div>
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm uppercase tracking-wider text-neutral-600 dark:text-neutral-400 mb-1">Completion Rate</p>
                      <h3 className="text-3xl font-bold">{userData.percentageRated.toFixed(1)}%</h3>
                      <div className="mt-2 flex items-center">
                        <FaPercentage className="text-green-600 mr-1" size={14} />
                        <span className="text-sm font-medium">of all clips</span>
                      </div>
                    </div>
                    <div className="p-3 bg-green-100 dark:bg-green-900/40 rounded-lg">
                      <FaPercentage className="text-green-600 dark:text-green-400" size={24} />
                    </div>
                  </div>
                </motion.div>

                {/* Rating distribution */}
                <motion.div 
                  whileHover={{ scale: 1.03, y: -5 }}
                  transition={{ type: "spring", stiffness: 300 }}
                  className="p-5 bg-gradient-to-br from-neutral-200 to-neutral-300 dark:from-purple-900/20 dark:to-purple-800/40 rounded-lg shadow relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-20 h-20 -mt-8 -mr-8 rounded-full bg-purple-500/20 dark:bg-purple-500/10"></div>
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm uppercase tracking-wider text-neutral-600 dark:text-neutral-400 mb-1">Most Given Rating</p>
                      <h3 className="text-3xl font-bold">
                        {(() => {
                          const mostCommon = ['1', '2', '3', '4', 'deny'].reduce((a, b) => userData[a] > userData[b] ? a : b);
                          return mostCommon === 'deny' ? 'Deny' : mostCommon;
                        })()}
                      </h3>
                      <div className="mt-2 flex items-center">
                        <FaChartPie className="text-purple-600 mr-1" size={14} />
                        <span className="text-sm font-medium">most common rating</span>
                      </div>
                    </div>
                    <div className="p-3 bg-purple-100 dark:bg-purple-900/40 rounded-lg">
                      <FaChartPie className="text-purple-600 dark:text-purple-400" size={24} />
                    </div>
                  </div>
                </motion.div>
              </div>
              
              {/* Progress bar */}
              <div className="mt-8">
                <div className="flex justify-between mb-2">
                  <span className="text-sm font-medium">Overall Progress</span>
                  <span className="text-sm font-medium">{userData.percentageRated.toFixed(1)}%</span>
                </div>
                <div className="h-4 w-full bg-neutral-200 dark:bg-neutral-700 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${userData.percentageRated}%` }}
                    transition={{ duration: 1, delay: 0.5 }}
                    className={`h-full ${userData.percentageRated < 20 
                      ? 'bg-red-500' 
                      : userData.percentageRated < 50 
                        ? 'bg-amber-500' 
                        : userData.percentageRated < 75 
                          ? 'bg-blue-500' 
                          : 'bg-green-500'}`}
                  ></motion.div>
                </div>
              </div>
            </div>
            
            {/* Rating breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
              <div>
                <h3 className="text-xl font-bold mb-4 flex items-center">
                  <FaChartPie className="mr-2 text-blue-500" />
                  Rating Distribution
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  {[
                    { rating: '1', color: COLORS[0] },
                    { rating: '2', color: COLORS[1] },
                    { rating: '3', color: COLORS[2] },
                    { rating: '4', color: COLORS[3] },
                    { rating: 'deny', color: COLORS[4], label: 'Deny' }
                  ].map(item => (
                    <div key={item.rating} className="bg-neutral-200 dark:bg-neutral-700 p-3 rounded-lg text-center">
                      <div className="text-2xl font-bold" style={{ color: item.color }}>{userData[item.rating]}</div>
                      <div className="text-sm text-neutral-600 dark:text-neutral-400">{item.label || `Rated ${item.rating}`}</div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div>
                <h3 className="text-xl font-bold mb-4 flex items-center">
                  <FaTrophy className="mr-2 text-amber-500" />
                  Your Achievement
                </h3>
                <div className="bg-neutral-200 dark:bg-neutral-700 p-4 rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className={`text-5xl ${
                      userData.percentageRated < 25 
                        ? 'text-red-500' 
                        : userData.percentageRated < 50 
                          ? 'text-amber-500' 
                          : userData.percentageRated < 75 
                            ? 'text-blue-500' 
                            : userData.percentageRated === 100 
                              ? 'text-green-500'
                              : 'text-green-500'
                    }`}>
                      {userData.percentageRated < 25 
                        ? '🌱' 
                        : userData.percentageRated < 50 
                          ? '🌿' 
                          : userData.percentageRated < 75 
                            ? '🌟' 
                            : userData.percentageRated === 100 
                              ? '🏆' 
                              : '⭐'
                      }
                    </div>
                    <div>
                      <h4 className="font-bold">{
                        userData.percentageRated < 25 
                          ? 'Novice Rater' 
                          : userData.percentageRated < 50 
                            ? 'Intermediate Rater' 
                            : userData.percentageRated < 75 
                              ? 'Pro Rater' 
                              : userData.percentageRated === 100 
                                ? 'Master Rater' 
                                : 'Expert Rater'
                      }</h4>
                      <p className="text-sm text-neutral-600 dark:text-neutral-400">
                        {userData.percentageRated < 25 
                          ? 'Just getting started! Keep going!' 
                          : userData.percentageRated < 50 
                            ? 'Getting there! Your input is valuable.' 
                            : userData.percentageRated < 75 
                              ? 'Impressive work! You\'re helping shape the highlights.' 
                              : userData.percentageRated === 100 
                                ? 'Incredible! You\'ve rated every single clip!' 
                                : 'Amazing progress! Almost at the finish line!'
                        }
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        );
      })}
      
      {/* Chart section */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="w-full p-6 md:p-8 mb-8 bg-neutral-300 dark:bg-neutral-800 text-neutral-900 dark:text-white transition duration-200 rounded-xl shadow-lg hover:shadow-xl"
      >
        <h2 className="text-3xl font-bold mb-6 border-b pb-3 border-neutral-400 dark:border-neutral-700 flex items-center">
          <FaChartPie className="mr-3 text-blue-500" /> 
          Rating Analytics
        </h2>
        
        <div className='bg-neutral-200 dark:bg-neutral-700 rounded-xl p-4 md:p-6 shadow-inner'>
          <ResponsiveContainer width="100%" height={500} className="mt-4">
            <PieChart>
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'rgba(30, 30, 30, 0.9)', 
                  border: 'none', 
                  borderRadius: '8px', 
                  padding: '12px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                }}
                itemStyle={{ color: '#fff' }}
              />
              <Legend 
                layout='vertical' 
                align='left' 
                verticalAlign='middle'
                iconType="circle" 
                iconSize={12}
                wrapperStyle={{ paddingLeft: '30px' }}
              />
              <Pie
                data={combinedRatings}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={130}
                fill="#8884d8"
                label
                labelLine={{ stroke: '#555', strokeWidth: 1 }}
                animationDuration={1500}
                animationBegin={300}
              >
                {combinedRatings.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              {userRatings.map(user => (
                <Pie
                  key={user.username}
                  data={[
                    { name: 'Rated', value: user.total },
                    { name: 'Unrated', value: seasonInfo.clipAmount - user.total }
                  ]}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  startAngle={90}
                  endAngle={-270}
                  innerRadius={180}
                  fill="#8884d8"
                  label
                  labelLine={false}
                  animationDuration={1500}
                  animationBegin={500}
                >
                  <Cell key="Rated" fill={COLORS[0]} />
                  <Cell key="Unrated" fill="#888888" />
                </Pie>
              ))}
            </PieChart>
          </ResponsiveContainer>
        </div>
      </motion.div>
      
      {/* Rated clips section */}
      {clips.length > 0 && Object.keys(ratings).length > 0 && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="w-full p-6 md:p-8 bg-neutral-300 dark:bg-neutral-800 text-neutral-900 dark:text-white transition duration-200 rounded-xl shadow-lg hover:shadow-xl"
        >
          <h2 className="text-3xl font-bold mb-6 border-b pb-3 border-neutral-400 dark:border-neutral-700 flex items-center">
            <FaClipboard className="mr-3 text-indigo-500" />
            Your Rated Clips
          </h2>
          
          {clips && ratings && (
            <RatedClips
              ratingsData={ratings}
              clipsData={clips}
              location={location}
            />
          )}
        </motion.div>
      )}
    </PageLayout>
  );
}

export default Stats;