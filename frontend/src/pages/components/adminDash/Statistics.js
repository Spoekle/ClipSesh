import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { FaCheck, FaTimes } from 'react-icons/fa';

const Statistics = ({ clipTeam, userRatings, seasonInfo  }) => {

    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
          return (
            <div className="custom-tooltip bg-neutral-700 p-4 rounded-md drop-shadow-lg">
              <p className="text-lg font-bold">{`${payload[0].payload.username}`}</p>
              <p className="text-sm">{`Clips Rated: ${payload[0].value}`}</p>
              <p className="text-sm">{`Percentage Rated: ${((payload[0].value / seasonInfo.clipAmount) * 100).toFixed(2)}%`}</p>
              <div className="grid grid-cols-2 w-full rounded-md p-2 mt-2 bg-black/20 justify-center">
                <p className="text-sm text-center">{`Rated 1: ${payload[1].value}`}</p>
                <p className="text-sm text-center">{`Rated 2: ${payload[2].value}`}</p>
                <p className="text-sm text-center">{`Rated 3: ${payload[3].value}`}</p>
                <p className="text-sm text-center">{`Rated 4: ${payload[4].value}`}</p>
                <p className="col-span-2 text-sm text-center text-red-600">{`Denied: ${payload[5].value}`}</p>
              </div>
            </div>
          );
        }
    
        return null;
      };

    return (
        <div className="w-full p-8 mt-8 bg-neutral-300 dark:bg-neutral-800 text-neutral-900 dark:text-white transition duration-200 rounded-md shadow-md animate-fade animate-delay-100">
            <h2 className="text-3xl font-bold mb-4">User Performance</h2>
            <ResponsiveContainer width="100%" height={400}>
                <BarChart data={userRatings} margin={{ top: 20, right: 10, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="username" />
                    <YAxis />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Bar name="Total Rated" dataKey="total" fill="#237aeb" />
                    <Bar name="Rated 1" dataKey="1" fill="#32d14d" />
                    <Bar name="Rated 2" dataKey="2" fill="#e6db10" />
                    <Bar name="Rated 3" dataKey="3" fill="#e6a910" />
                    <Bar name="Rated 4" dataKey="4" fill="#eb8723" />
                    <Bar name="Denied" dataKey="deny" fill="#e64040" />
                </BarChart>
            </ResponsiveContainer>
            <div className="">
                <h3 className="text-2xl font-bold mb-4">User Stats</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {userRatings && [...clipTeam]
                        .map(user => {
                            const userRating = userRatings.find(rating => rating.username === user.username) || { '1': 0, '2': 0, '3': 0, '4': 0, 'deny': 0, total: 0 };
                            const percentageRated = ((userRating.total / seasonInfo.clipAmount) * 100).toFixed(2);
                            return { ...user, ...userRating, percentageRated, total: Number(userRating.total) };
                        })
                        .filter(user => !['editor', 'uploader'].includes(user.roles))
                        .sort((a, b) => b.total - a.total)
                        .map(user => (
                            <div key={user.username} className="p-4 bg-neutral-400 dark:bg-neutral-700 text-neutral-900 dark:text-white transition duration-200 rounded-md">
                                <div className="flex justify-between items-center">
                                    <h4 className="text-lg font-semibold mb-2">{user.username}</h4>
                                    <p className={`text-md px-2 py-1 rounded-lg ${user.percentageRated > 20 ? 'bg-green-600' : 'bg-red-600'} origin-top`}>{user.percentageRated > 20 ? <FaCheck /> : <FaTimes />}</p>
                                </div>
                                <p className="text-sm">Clips Rated: {user.total}</p>
                                <p className="text-sm">Percentage Rated: {user.percentageRated}%</p>
                                <p className="text-sm">Denied: {user.deny}</p>
                            </div>
                        ))}
                </div>
            </div>
        </div>
    );
}

export default Statistics;
