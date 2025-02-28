import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import apiUrl from '../config/config';
import axios from 'axios';
import { FaYoutube, FaPlay, FaArrowRight, FaGamepad, FaStar, FaUsers } from 'react-icons/fa';
import { motion } from 'framer-motion';
import banner1 from '../media/banner1.png';

function HomePage() {
  const [config, setConfig] = useState({});
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);
  const [showVideo, setShowVideo] = useState(false);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const response = await axios.get(`${apiUrl}/api/admin/config`);
        setConfig(response.data[0]);
      } catch (error) {
        console.error('Error fetching config:', error);
      }
    };

    fetchConfig();
  }, []);

  const handleVideoLoad = () => {
    setIsVideoLoaded(true);
  };

  const getYoutubeId = (url) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const videoId = config.latestVideoLink ? getYoutubeId(config.latestVideoLink) : null;
  const embedUrl = videoId ? `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&controls=0&showinfo=0&rel=0&loop=1&playlist=${videoId}` : null;
  const thumbnailUrl = videoId ? `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg` : banner1;

  return (
    <div className="min-h-screen bg-neutral-100 dark:bg-neutral-900 text-neutral-900 dark:text-white">
      <Helmet>
        <title>ClipSesh | Discover and Rate Beat Saber Highlights</title>
        <meta
          name="description"
          content="ClipSesh is a community platform for Beat Saber players to discover, rate, and discuss the best clips from the community. Join now and be part of the highlights!"
        />
      </Helmet>

      {/* Hero Section with Video Background */}
      <section className="relative w-full h-screen overflow-hidden">
        {/* Background - either video or image */}
        <div className="absolute inset-0 w-full h-full">
          {showVideo && embedUrl ? (
            <div className="relative w-full h-full">
              <iframe
                className="absolute w-full h-full object-cover"
                src={embedUrl}
                frameBorder="0"
                allowFullScreen
                allow="autoplay"
                title="Latest YouTube Video"
                onLoad={handleVideoLoad}
              />
              {!isVideoLoaded && (
                <div className="absolute inset-0 bg-black flex items-center justify-center">
                  <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500"></div>
                </div>
              )}
            </div>
          ) : (
            <div 
              className="w-full h-full bg-cover bg-center transform transition-transform duration-15000 animate-slow-zoom"
              style={{ 
                backgroundImage: `url(${thumbnailUrl})`,
              }}
            />
          )}
          <div className="absolute inset-0 bg-black/60"></div>
        </div>

        {/* Hero Content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-white z-10">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="container max-w-5xl mx-auto px-6 text-center"
          >
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="text-5xl md:text-7xl lg:text-8xl font-bold mb-6"
            >
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-red-500">
                ClipSesh!
              </span>
            </motion.h1>
            
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="text-xl md:text-2xl text-neutral-200 max-w-3xl mx-auto mb-10"
            >
              Discover, rate, and discuss the best Beat Saber clips from the community. 
              Shape the future of Seasonal Highlights!
            </motion.p>
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.6, duration: 0.4 }}
              className="flex flex-wrap gap-4 justify-center"
            >
              <Link to="/clips">
                <button className="bg-cc-red hover:bg-red-600 text-white text-lg px-8 py-4 rounded-lg shadow-lg transition transform duration-200 hover:scale-105 flex items-center">
                  Browse Clips <FaArrowRight className="ml-2" />
                </button>
              </Link>
              
              {!showVideo && videoId && (
                <button 
                  onClick={() => setShowVideo(true)}
                  className="bg-neutral-800/80 hover:bg-neutral-700 backdrop-blur-sm text-white text-lg px-8 py-4 rounded-lg shadow-lg transition transform duration-200 hover:scale-105 flex items-center"
                >
                  <FaPlay className="mr-2" /> Play Latest Video
                </button>
              )}
            </motion.div>
          </motion.div>
          
          {/* Scroll indicator */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1, duration: 0.8, repeat: Infinity, repeatType: "reverse" }}
            className="absolute bottom-8"
          >
            <div className="w-8 h-12 border-2 border-white rounded-full flex justify-center">
              <div className="w-1 h-3 bg-white rounded-full mt-2 animate-bounce"></div>
            </div>
            <p className="text-sm mt-2 text-center">Scroll Down</p>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-white dark:bg-neutral-800">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-3xl md:text-4xl font-bold mb-12 text-center">
            A New Era for <span className="text-cc-red">Beat Saber Highlights</span>
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
              className="bg-neutral-100 dark:bg-neutral-700 rounded-xl p-6 shadow-lg"
            >
              <div className="w-14 h-14 bg-blue-500 rounded-full flex items-center justify-center mb-4">
                <FaGamepad className="text-white text-2xl" />
              </div>
              <h3 className="text-xl font-bold mb-3">Discover Amazing Clips</h3>
              <p className="text-neutral-700 dark:text-neutral-300">
                Browse through a curated collection of the most impressive Beat Saber plays from talented players across the community.
              </p>
            </motion.div>
            
            {/* Feature 2 */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              viewport={{ once: true }}
              className="bg-neutral-100 dark:bg-neutral-700 rounded-xl p-6 shadow-lg"
            >
              <div className="w-14 h-14 bg-cc-red rounded-full flex items-center justify-center mb-4">
                <FaStar className="text-white text-2xl" />
              </div>
              <h3 className="text-xl font-bold mb-3">Rate and Influence</h3>
              <p className="text-neutral-700 dark:text-neutral-300">
                Vote on your favorite clips and help determine which ones make it into the official Cube Community highlights video.
              </p>
            </motion.div>
            
            {/* Feature 3 */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              viewport={{ once: true }}
              className="bg-neutral-100 dark:bg-neutral-700 rounded-xl p-6 shadow-lg"
            >
              <div className="w-14 h-14 bg-indigo-500 rounded-full flex items-center justify-center mb-4">
                <FaUsers className="text-white text-2xl" />
              </div>
              <h3 className="text-xl font-bold mb-3">Join the Community</h3>
              <p className="text-neutral-700 dark:text-neutral-300">
                Comment on clips, discuss techniques, and connect with other Beat Saber enthusiasts from around the world.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Latest Highlights Section */}
      <section className="py-20 px-4 bg-neutral-100 dark:bg-neutral-900">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-3xl md:text-4xl font-bold mb-12 text-center">
            Latest <span className="text-cc-red">Highlights</span>
          </h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7 }}
              viewport={{ once: true }}
            >
              <h3 className="text-2xl font-bold mb-4">Watch the Latest Compilation</h3>
              <p className="text-neutral-700 dark:text-neutral-300 mb-6">
                The Cube Community team regularly creates highlight videos featuring the best-rated clips from our community. 
                Check out the latest compilation and see if your favorite clips made it in!
              </p>
              
              <Link to="https://www.youtube.com/@CubeCommunity" target="_blank" rel="noopener noreferrer">
                <button className="flex items-center bg-cc-red hover:bg-red-600 text-white px-6 py-3 rounded-lg shadow-lg transition transform duration-200 hover:scale-105">
                  Subscribe on YouTube <FaYoutube className="ml-2 text-xl" />
                </button>
              </Link>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7 }}
              viewport={{ once: true }}
              className="rounded-xl overflow-hidden shadow-xl"
            >
              {videoId ? (
                <div className="aspect-video">
                  <iframe
                    src={`https://www.youtube.com/embed/${videoId}`}
                    className="w-full h-full rounded-xl"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    title="Latest YouTube Video"
                  ></iframe>
                </div>
              ) : (
                <img src={banner1} alt="Cube Community" className="w-full rounded-xl" />
              )}
            </motion.div>
          </div>
        </div>
      </section>
      
      {/* Call to Action */}
      <section className="py-20 px-4 bg-gradient-to-br from-blue-600 to-indigo-800 text-white">
        <div className="container mx-auto max-w-4xl text-center">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="text-3xl md:text-4xl font-bold mb-6"
          >
            Ready to Join the Community?
          </motion.h2>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            viewport={{ once: true }}
            className="text-xl mb-8"
          >
            Start exploring, rating, and discussing the best Beat Saber clips today!
          </motion.p>
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            viewport={{ once: true }}
          >
            <Link to="/clips">
              <button className="bg-white text-blue-600 text-xl font-bold px-10 py-4 rounded-lg shadow-lg transition transform duration-200 hover:scale-105 hover:bg-neutral-100">
                Get Started Now
              </button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Custom animation for slow zoom effect */}
      <style jsx>{`
        @keyframes slowZoom {
          0% { transform: scale(1); }
          100% { transform: scale(1.1); }
        }
        .animate-slow-zoom {
          animation: slowZoom 20s ease-in-out infinite alternate;
        }
      `}</style>
    </div>
  );
}

export default HomePage;
