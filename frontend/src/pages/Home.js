import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import apiUrl from '../config/config';
import axios from 'axios';
import banner1 from '../media/banner1.png';
import { FaYoutube } from 'react-icons/fa';

function HomePage() {
  const [config, setConfig] = useState({});

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const response = await axios.get(`${apiUrl}/api/admin/config`);
        setConfig(response.data[0]);
        console.log('Config:', response.data[0]);
      } catch (error) {
        console.error('Error fetching config:', error);
      }
    };

    fetchConfig();
  }, []);

  return (
    <div className="min-h-screen bg-neutral-200 dark:bg-neutral-900 text-neutral-900 dark:text-white relative">
      <Helmet>
        <title>Home</title>
        <meta
          name="description"
          description="ClipSesh! is a site for Beat Saber players by Beat Saber players. On this site you will be able to view all submitted clips
              from the Cube Community highlights channel. You can rate them, leave comments and discuss with fellow players!"
        />
      </Helmet>

      <div className="flex min-h-screen justify-center items-center animate-fade relative z-10">
        {config.latestVideoLink ? (
          <iframe
            className="absolute w-full h-full z-0 object-cover"
            src={config.latestVideoLink.replace('watch?v=', 'embed/') + '?autoplay=1&mute=1'}
            frameborder="0"
            allowfullscreen
            allow='autoplay'
            title="Latest YouTube Video"
          />
        ) : (
          <img src={banner1} className="absolute w-full h-full z-0 object-cover" />
        )}
        <div className="flex bg-gradient-to-b from-neutral-900 to-bg-black/20 to-60% backdrop-blur-lg text-white justify-center items-center w-screen h-screen">
          <div className="grid grid-cols-1 md:grid-cols-2 justify-between items-center">
            <div className="flex flex-col justify-center items-center">
              <h1 className="text-4xl md:text-7xl lg:text-9xl font-bold mb-4 text-center">ClipSesh!</h1>
              <h1 className="text-lg md:text-xl lg:text-2xl mb-4 text-center">A new generation for Seasonal Highlights!</h1>
            </div>
            <div className="flex flex-col justify-center items-center">
              <Link to="/clips">
                <button className="bg-cc-red text-white text-center text-xl md:text-3xl lg:text-5xl font-bold py-3 px-6 rounded-lg shadow-lg transition duration-300">
                  Get Started!
                </button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-grow flex flex-col p-4 pt-8 bg-neutral-200 dark:bg-neutral-900 transition duration-200 justify-center items-center relative z-10">
        <div className="container grid grid-cols-1 md:grid-cols-2 justify-center items-center w-full h-full">
          <div className="flex flex-col justify-center items-center m-4 p-4 bg-neutral-300 dark:bg-neutral-950 transition duration-200 rounded-lg aspect-video">
            <p className="text-2xl font-bold m-4 text-center">Content Cubes come together to rate YOUR clips for the highlights!</p>
            <p className="text-lg m-4 text-center">Now everyone can upvote or downvote clips to influence how the highlights will play out</p>
            <div className="flex flex-col justify-between mt-8">
              <Link to="/clips">
                <button className="bg-cc-red text-white hover:bg-white hover:text-cc-red font-bold py-3 px-6 rounded-lg shadow-lg transition duration-300">
                  View Clips
                </button>
              </Link>
            </div>
          </div>
          <div className="w-auto m-4">
            <img src={banner1} alt="Banner" className="rounded-lg aspect-video" />
          </div>
        </div>

        <div className="container grid grid-cols-1 md:grid-cols-2 justify-center items-center w-full h-full">
          <div className='w-auto m-4'>
            {config.latestVideoLink ? (
              <iframe
                src={config.latestVideoLink.replace('watch?v=', 'embed/')}
                allow="accelerometer; autoplay; clipboard-write;"
                allowFullScreen
                title="Latest YouTube Video"
                className="rounded-2xl w-full aspect-video"
              ></iframe>
            ) : (
              <p className="text-cc-red">No video found for the latest highlights</p>
            )}
          </div>
          <div className="flex flex-col justify-center items-center m-4 p-4 bg-neutral-300 dark:bg-neutral-950 transition duration-200 rounded-lg aspect-video">
            <h1 className="text-3xl m-4 text-center">Watch the latest highlights here!</h1>
            <div className="flex flex-col justify-between mt-8">
              <Link to="https://www.youtube.com/@CubeCommunity">
                <button className="flex bg-cc-red text-white hover:bg-white hover:text-cc-red items-center font-bold py-3 px-6 rounded-lg shadow-lg transition duration-300">
                  YouTube <FaYoutube className="ml-2" />
                </button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default HomePage;
