import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import apiUrl from '../config/config';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import axios from 'axios';
import { saveAs } from 'file-saver';
import { BiLoaderCircle } from 'react-icons/bi';
import LoadingBar from 'react-top-loading-bar';
import background from '../media/editor.webp';
import { FaDiscord } from "react-icons/fa";

function EditorDash() {
  const [config, setConfig] = useState({ denyThreshold: 0, latestVideoLink: '' });
  const [clips, setClips] = useState([]);
  const [ratings, setRatings] = useState({});
  const [downloading, setDownloading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [seasonInfo, setSeasonInfo] = useState({});

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
      setProgress(100);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching initial data:', error);
    }
  };

  const fetchConfig = async () => {
    try {
      const response = await axios.get(`${apiUrl}/api/admin/config`,);

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

  //get the count of denied clips
  const deniedClips = clips.filter(clip => {
    const ratingData = ratings[clip._id];
    return ratingData && ratingData.ratingCounts.some(rateData => rateData.rating === 'deny' && rateData.count >= config.denyThreshold);
  }).length;

  const getCurrentDate = () => {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const downloadClips = async () => {
    if (!window.confirm("Are you sure you want to download the clips? This might take a while so please stay on this page.")) {
      return;
    }
  
    setDownloading(true);
    setDownloadProgress(0);
  
    const filteredClips = clips.filter((clip) => {
      const ratingData = ratings[clip._id];
      return (
        ratingData &&
        ratingData.ratingCounts.every(
          (rateData) => rateData.rating !== 'deny' || rateData.count < config.denyThreshold
        )
      );
    });
  
    try {
      const response = await axios.post(`${apiUrl}/zips/download`, {
        clips: filteredClips.map((clip) => {
          const ratingData = ratings[clip._id];
          const mostChosenRating = ratingData.ratingCounts.reduce(
            (max, rateData) => (rateData.count > max.count ? rateData : max),
            ratingData.ratingCounts[0]
          );
          return { ...clip, rating: mostChosenRating.rating };
        }),
      }, {
        responseType: 'blob', // Download as binary data (zip)
        onDownloadProgress: (progressEvent) => {
          if (progressEvent.total) {
            setDownloadProgress(Math.round((progressEvent.loaded / progressEvent.total) * 100));
          } else {
            setDownloadProgress(0);
          }
        },
      });
  
      if (response.status !== 200) {
        throw new Error('Failed to download clips');
      }
  
      const blob = new Blob([response.data], { type: 'application/zip' });
      const currentDate = getCurrentDate();
      saveAs(blob, `clips-${currentDate}.zip`);
    } catch (error) {
      console.error('Error downloading clips:', error);
    } finally {
      setDownloading(false);
    }
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

  return (
    <div className="min-h-screen text-white flex flex-col items-center bg-neutral-200 dark:bg-neutral-900 transition duration-200">
      <Helmet>
        <title>Editor Dash</title>
        <meta name="description" description="ClipSesh! is a site for Beat Saber players by Beat Saber players. On this site you will be able to view all submitted clips"
        />
      </Helmet>
      <div className='w-full'>
        <LoadingBar color='#f11946' progress={progress} onLoaderFinished={() => setProgress(0)} />
      </div>
      <div className="w-full flex h-96 justify-center items-center animate-fade" style={{ backgroundImage: `url(${background})`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
        <div className="flex bg-gradient-to-b from-neutral-900 to-bg-black/20 backdrop-blur-lg justify-center items-center w-full h-full">
          <div className="flex flex-col justify-center items-center">
            <h1 className="text-4xl font-bold mb-4 text-center">Editor Dashboard</h1>
            <h1 className="text-3xl mb-4 text-center">Download the whole season in 1 click...</h1>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="container pt-20 mb-4 text-neutral-900 dark:text-white bg-neutral-200 dark:bg-neutral-900 flex flex-col items-center justify-center animate-fade">
          <h1 className="text-5xl font-bold mb-8 text-center">Loading...</h1>
          <BiLoaderCircle className="animate-spin text-7xl" />
        </div>
      ) : (

        <div className="container pt-20 mb-4 text-neutral-900 dark:text-white bg-neutral-200 dark:bg-neutral-900 transition duration-200 justify-center justify-items-center animate-fade">
          <div className="w-full p-8 bg-neutral-300 dark:bg-neutral-800 text-neutral-900 dark:text-white transition duration-200 rounded-md shadow-md">
            <h2 className="text-3xl font-bold mb-4">Season info</h2>
            <div className="grid grid-cols-2 text-center justify-center">
              <h2 className="text-2xl font-bold mb-4">Season: {seasonInfo.season}</h2>
              <div>
                <h2 className="text-2xl font-bold mb-4">Clip Amount: {seasonInfo.clipAmount}</h2>
                <h2 className="text-xl font-semibold mb-4 text-red-600">Denied Clips: {deniedClips}</h2>
              </div>
            </div>
          </div>

          <div className="grid mt-8 lg:grid-cols-3 md:grid-cols-2 grid-cols-1 gap-4 w-full">
            <div className="col-span-1 w-full bg-neutral-300 dark:bg-neutral-800 text-neutral-900 dark:text-white transition duration-200 p-8 rounded-md shadow-md animate-fade animate-delay-[200ms]">
              <h2 className="text-3xl font-bold mb-4">Download Clips</h2>
              {downloading && (
                <div className="flex flex-col justify-center items-center space-y-2">
                  <BiLoaderCircle className="animate-spin h-5 w-5 text-white" />
                  <span>Downloading Clips...</span>
                  <progress value={downloadProgress} max="100" className="w-full"></progress>
                </div>
              )}
              <button
                onClick={downloadClips}
                className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-2 rounded-md focus:outline-none focus:bg-green-600"
              >
                Download All Clips
              </button>
            </div>
          </div>
        </div>
      )}
    </div>

  );
}

export default EditorDash;
