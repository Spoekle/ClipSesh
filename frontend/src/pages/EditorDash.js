import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import apiUrl from '../config/config';
import axios from 'axios';
import { saveAs } from 'file-saver';
import LoadingBar from 'react-top-loading-bar';
import background from '../media/editor.webp';
import { motion } from 'framer-motion';
import { 
  FaDownload, 
  FaArchive, 
  FaCalendarAlt, 
  FaClipboard, 
  FaBan,
  FaSpinner, 
  FaFileArchive,
  FaHistory,
  FaCheck,
  FaInfoCircle
} from 'react-icons/fa';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function EditorDash() {
  const [config, setConfig] = useState({ denyThreshold: 0, latestVideoLink: '' });
  const [clips, setClips] = useState([]);
  const [ratings, setRatings] = useState({});
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [seasonInfo, setSeasonInfo] = useState({});
  const [zips, setZips] = useState([]);
  const [zipsLoading, setZipsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('current');

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setProgress(10);
      await fetchConfig();
      setProgress(30);
      getSeason();
      setProgress(50);
      await fetchClipsAndRatings();
      await fetchZips();
      setProgress(100);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching initial data:', error);
      toast.error('Failed to load data. Please try again.');
    }
  };

  const fetchConfig = async () => {
    try {
      const response = await axios.get(`${apiUrl}/api/admin/config`);

      if (response) {
        setConfig(response.data[0]);
        console.log('Config fetched successfully:', response.data[0]);
      }
    } catch (error) {
      console.error('Error fetching config:', error);
    }
  };

  const fetchClipsAndRatings = async () => {
    try {
      const clipResponse = await axios.get(`${apiUrl}/api/clips`);
      setClips(clipResponse.data);
      setSeasonInfo(prevSeasonInfo => ({
        ...prevSeasonInfo,
        clipAmount: clipResponse.data.length
      }));
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
          setProgress(90);
          return acc;
        }, {});
        setRatings(ratingsData);
      }
    } catch (error) {
      console.error('Error fetching clips and ratings:', error);
    }
  };

  const fetchZips = async () => {
    try {
      const response = await axios.get(`${apiUrl}/api/zips`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setZips(response.data);
      setZipsLoading(false);
    } catch (error) {
      console.error('Error fetching zips:', error);
      toast.error('Failed to load zip archives');
      setZipsLoading(false);
    }
  };

  const deniedClips = clips.filter(clip => {
    const ratingData = ratings[clip._id];
    return ratingData && ratingData.ratingCounts.some(rateData => rateData.rating === 'deny' && rateData.count >= config.denyThreshold);
  }).length;

  const approvedClips = seasonInfo.clipAmount - deniedClips;

  const getSeason = () => {
    const now = new Date();
    const month = now.getMonth() + 1;
    const day = now.getDate();
    let season = '';

    if (
      (month === 3 && day >= 20) ||
      (month > 3 && month < 6) ||
      (month === 6 && day <= 20)
    ) {
      season = 'Spring';
    } else if (
      (month === 6 && day >= 21) ||
      (month > 6 && month < 9) ||
      (month === 9 && day <= 20)
    ) {
      season = 'Summer';
    } else if (
      (month === 9 && day >= 21) ||
      (month > 9 && month < 12) ||
      (month === 12 && day <= 20)
    ) {
      season = 'Fall';
    } else {
      season = 'Winter';
    }

    setSeasonInfo(prevSeasonInfo => ({
      ...prevSeasonInfo,
      season
    }));
  };

  // Calculate statistics
  const getApprovedPercentage = () => {
    if (seasonInfo.clipAmount === 0) return 0;
    return ((approvedClips / seasonInfo.clipAmount) * 100).toFixed(1);
  };

  const getDeniedPercentage = () => {
    if (seasonInfo.clipAmount === 0) return 0;
    return ((deniedClips / seasonInfo.clipAmount) * 100).toFixed(1);
  };
  
  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen text-white flex flex-col items-center bg-neutral-200 dark:bg-neutral-900 transition duration-200">
        <Helmet>
          <title>Editor Dashboard | ClipSesh</title>
          <meta 
            name="description" 
            content="ClipSesh Editor Dashboard - Process and download clip collections" 
          />
        </Helmet>
        <div className='w-full'>
          <LoadingBar color='#3b82f6' height="4px" progress={progress} onLoaderFinished={() => setProgress(0)} />
        </div>
        <div 
          className="w-full flex h-96 justify-center items-center animate-fade"
          style={{ 
            backgroundImage: `url(${background})`, 
            backgroundSize: 'cover', 
            backgroundPosition: 'center', 
            clipPath: 'polygon(0 0, 100% 0, 100% 80%, 0 100%)' 
          }}
        >
          <div className="flex bg-gradient-to-b from-neutral-900/80 to-bg-black/40 backdrop-blur-md justify-center items-center w-full h-full">
            <div className="flex flex-col justify-center items-center">
              <h1 className="text-4xl font-bold mb-4 text-center">Editor Dashboard</h1>
              <div className="flex items-center gap-3">
                <FaSpinner className="animate-spin text-xl" />
                <h2 className="text-xl">Loading season data...</h2>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-white flex flex-col items-center bg-neutral-200 dark:bg-neutral-900 transition duration-200">
      <ToastContainer position="top-right" />
      <Helmet>
        <title>Editor Dashboard | ClipSesh</title>
        <meta 
          name="description" 
          content="ClipSesh Editor Dashboard - Process and download clip collections" 
        />
      </Helmet>
      <div className='w-full'>
        <LoadingBar color='#3b82f6' height="4px" progress={progress} onLoaderFinished={() => setProgress(0)} />
      </div>
      <div 
        className="w-full flex h-96 justify-center items-center animate-fade"
        style={{ 
          backgroundImage: `url(${background})`, 
          backgroundSize: 'cover', 
          backgroundPosition: 'center', 
          clipPath: 'polygon(0 0, 100% 0, 100% 80%, 0 100%)' 
        }}
      >
        <div className="flex bg-gradient-to-b from-neutral-900/80 to-bg-black/40 backdrop-blur-md justify-center items-center w-full h-full">
          <div className="flex flex-col justify-center items-center px-4 md:px-0">
            <motion.h1 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-4xl md:text-5xl font-bold mb-4 text-center text-white drop-shadow-lg"
            >
              Editor Dashboard
            </motion.h1>
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-2xl md:text-3xl mb-4 text-center text-white/90 drop-shadow-md"
            >
              Process and download seasonal clips
            </motion.h1>
          </div>
        </div>
      </div>

      <div className="container px-4 md:px-8 pt-16 pb-12 bg-neutral-200 dark:bg-neutral-900 transition duration-200 text-white justify-center justify-items-center">
        
        {/* Season Info Card */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="w-full p-6 md:p-8 bg-neutral-300 dark:bg-neutral-800 text-neutral-900 dark:text-white transition duration-200 rounded-xl shadow-lg hover:shadow-xl"
        >
          <h2 className="text-3xl font-bold mb-6 border-b pb-3 border-neutral-400 dark:border-neutral-700 flex items-center">
            <FaInfoCircle className="mr-3 text-blue-500" />
            Current Season Overview
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Season */}
            <motion.div 
              whileHover={{ scale: 1.02 }}
              className="p-5 bg-gradient-to-br from-neutral-200 to-neutral-300 dark:from-neutral-700 dark:to-neutral-600 rounded-lg shadow"
            >
              <div className="flex justify-center mb-2 text-blue-500 dark:text-blue-400">
                <FaCalendarAlt size={28} />
              </div>
              <h3 className="text-lg font-medium mb-2 text-center">Season</h3>
              <h2 className="text-3xl font-bold text-center">{seasonInfo.season}</h2>
            </motion.div>
            
            {/* Approved Clips */}
            <motion.div 
              whileHover={{ scale: 1.02 }}
              className="p-5 bg-gradient-to-br from-neutral-200 to-neutral-300 dark:from-neutral-700 dark:to-neutral-600 rounded-lg shadow"
            >
              <div className="flex justify-center mb-2 text-green-500 dark:text-green-400">
                <FaCheck size={28} />
              </div>
              <h3 className="text-lg font-medium mb-2 text-center">Approved Clips</h3>
              <h2 className="text-3xl font-bold text-center">{approvedClips}</h2>
              <p className="text-center mt-1 text-green-600 dark:text-green-400 font-medium">
                {getApprovedPercentage()}% of total
              </p>
            </motion.div>
            
            {/* Denied Clips */}
            <motion.div 
              whileHover={{ scale: 1.02 }}
              className="p-5 bg-gradient-to-br from-neutral-200 to-neutral-300 dark:from-neutral-700 dark:to-neutral-600 rounded-lg shadow"
            >
              <div className="flex justify-center mb-2 text-red-500 dark:text-red-400">
                <FaBan size={28} />
              </div>
              <h3 className="text-lg font-medium mb-2 text-center">Denied Clips</h3>
              <h2 className="text-3xl font-bold text-center">{deniedClips}</h2>
              <p className="text-center mt-1 text-red-600 dark:text-red-400 font-medium">
                {getDeniedPercentage()}% of total
              </p>
            </motion.div>
          </div>    
        </motion.div>
        
        {/* Available Archives */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="w-full p-6 md:p-8 mt-8 bg-neutral-300 dark:bg-neutral-800 text-neutral-900 dark:text-white transition duration-200 rounded-xl shadow-lg hover:shadow-xl"
        >
          <h2 className="text-3xl font-bold mb-6 border-b pb-3 border-neutral-400 dark:border-neutral-700 flex items-center">
            <FaFileArchive className="mr-3 text-amber-500" /> 
            Available Archives
          </h2>
          
          {/* Tab navigation */}
          <div className="flex space-x-2 mb-6 overflow-x-auto pb-2">
            <button
              onClick={() => setActiveTab('current')}
              className={`px-4 py-2 rounded-lg flex items-center gap-2 whitespace-nowrap transition-all ${
                activeTab === 'current'
                  ? 'bg-blue-600 text-white font-medium'
                  : 'bg-neutral-200 dark:bg-neutral-700 text-neutral-800 dark:text-white'
              }`}
            >
              <FaCalendarAlt /> Current Season
            </button>
            <button
              onClick={() => setActiveTab('all')}
              className={`px-4 py-2 rounded-lg flex items-center gap-2 whitespace-nowrap transition-all ${
                activeTab === 'all'
                  ? 'bg-blue-600 text-white font-medium'
                  : 'bg-neutral-200 dark:bg-neutral-700 text-neutral-800 dark:text-white'
              }`}
            >
              <FaHistory /> All Archives
            </button>
          </div>
          
          {zipsLoading ? (
            <div className="flex justify-center items-center py-16">
              <FaSpinner className="animate-spin text-4xl" />
            </div>
          ) : zips.length === 0 ? (
            <div className="bg-neutral-200 dark:bg-neutral-700 rounded-lg p-8 text-center">
              <p className="text-lg">No archives available yet.</p>
              <p className="mt-2 text-neutral-600 dark:text-neutral-400">
                Process clips to create zip archives for download.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {zips
                .filter(zip => activeTab === 'all' || zip.season === seasonInfo.season)
                .map(zip => (
                  <motion.div 
                    key={zip._id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    whileHover={{ scale: 1.01 }}
                    className="flex justify-between items-center bg-neutral-200 dark:bg-neutral-700 p-4 rounded-lg shadow-md"
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-amber-100 dark:bg-amber-900/30 rounded-full text-amber-600 dark:text-amber-400">
                        <FaFileArchive size={24} />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg">{zip.name}</h3>
                        <div className="flex items-center gap-6 text-sm text-neutral-700 dark:text-neutral-300 mt-1">
                          <div className="flex items-center gap-1">
                            <FaCalendarAlt />
                            <span>{zip.season} Season</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <FaClipboard />
                            <span>{zip.clipAmount} clips</span>
                          </div>
                          <span>{(zip.size / 1000000).toFixed(2)} MB</span>
                        </div>
                      </div>
                    </div>
                    
                    <motion.button
                      onClick={() => { saveAs(zip.url); }}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      className="bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-full shadow-md hover:shadow-lg transition-all duration-200"
                      title="Download Archive"
                    >
                      <FaDownload size={18} />
                    </motion.button>
                  </motion.div>
                ))}
            </div>
          )}
        </motion.div>
        
      </div>
    </div>
  );
}

export default EditorDash;
