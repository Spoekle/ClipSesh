import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import axios from 'axios';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import LoadingBar from 'react-top-loading-bar';
import RatedClips from './components/clipViewer/RatedClips';
import apiUrl from '../config/config';

function Stats({ user }) {
  const [progress, setProgress] = useState(0);
  const [ratings, setRatings] = useState({});
  const [userRatings, setUserRatings] = useState([]);
  const [seasonInfo, setSeasonInfo] = useState({});
  const [clips, setClips] = useState([]);

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

  return (
    <div className="min-h-screen text-white flex flex-col items-center bg-neutral-200 dark:bg-neutral-900 transition duration-200">
      <Helmet>
        <title>{user && user.username + "'s stats"}</title>
        <meta name="description" description={user && user.username + "'s stats page"}
        />
      </Helmet>
      <div className='w-full'>
        <LoadingBar color='#f11946' progress={progress} onLoaderFinished={() => setProgress(0)} />
      </div>
      <div className="w-full flex h-96 justify-center items-center animate-fade" style={{ backgroundImage: `url(${user.profilePicture})`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
        <div className="flex bg-gradient-to-b from-neutral-900 to-bg-black/20 backdrop-blur-lg justify-center items-center w-full h-full">
          <div className="flex flex-col justify-center items-center">
            <h1 className="text-4xl font-bold mb-4 text-center">Stats</h1>
            <h1 className="text-3xl mb-4 text-center">Let's see what you have done for ClipSesh this season {user.username}</h1>
          </div>
        </div>
      </div>

      <div className="container pt-20 mb-4 bg-neutral-200 dark:bg-neutral-900 transition duration-200 text-white justify-center justify-items-center animate-fade">
        <div className="w-full p-8 bg-neutral-300 dark:bg-neutral-800 text-neutral-900 dark:text-white transition duration-200 rounded-md shadow-md">
          <h2 className="text-3xl font-bold mb-4">User summary</h2>
          <div className="justify-center">
            {userRatings.map(user => (
              <div key={user.username}>
                <div className="text-2xl">
                  {user.percentageRated < 20 ? (
                    <p>Oh no, you have rated less than 20% of the clips. We would love to see you rate some more!</p>
                  ) : user.percentageRated === 100 ? (
                    <p>No way! You rated every single clip that has been uploaded to ClipSesh up until now.<br />
                      Sit back and relax, you deserved it!</p>
                  ) : user.percentageRated > 50 ? (
                    <p>Keep it up, you rated more than half of the clips on ClipSesh!</p>
                  ) : (
                    <p>Good job, you have rated between 20% and 50% of the clips. Keep going!</p>
                  )}
                </div>
                <div className="">
                  <h3 className="text-xl mt-2">This is what you have done so far {user.username}:</h3>
                  <p className='text-lg'>You have rated {user.total} clips!</p>
                  <p className='text-lg'>Which means you have gone through {user.percentageRated.toFixed(2)}% of all clips</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="w-full p-8 mt-8 bg-neutral-300 dark:bg-neutral-800 text-neutral-900 dark:text-white transition duration-200 rounded-md shadow-md">
          <h2 className="text-3xl font-bold mb-4">Season info</h2>
          <div className="grid grid-cols-2 text-center justify-center">
            <h2 className="text-2xl font-bold mb-4">Season: {seasonInfo.season}</h2>
            <h2 className="text-2xl font-bold mb-4">Clip Amount: {seasonInfo.clipAmount}</h2>
          </div>
        </div>

        <div className="w-full p-8 mt-8 bg-neutral-300 dark:bg-neutral-800 text-neutral-900 dark:text-white transition duration-200 rounded-md shadow-md">
          <h2 className="text-3xl font-bold mb-4">User Performance</h2>
          <div className='bg-neutral-600 rounded-xl p-8'>
            <ResponsiveContainer width="100%" height={500}>
              <PieChart>
                <Tooltip />
                <Legend layout='vertical' align='left' verticalAlign='middle' />
                <Pie
                  data={combinedRatings}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={130}
                  fill="#8884d8"
                  label
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
                  >
                    <Cell key="Rated" fill={COLORS[0]} />
                    <Cell key="Unrated" fill="#888888" />
                  </Pie>
                ))}
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
        {clips.length > 0 && Object.keys(ratings).length > 0 && (
          <div className="w-full p-8 mt-8 bg-neutral-300 dark:bg-neutral-800 text-neutral-900 dark:text-white transition duration-200 rounded-md shadow-md">
            <h2 className="text-3xl font-bold mb-4">Rated Clips</h2>
            {clips && ratings && (
              <RatedClips
                ratingsData={ratings}
                clipsData={clips}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default Stats;