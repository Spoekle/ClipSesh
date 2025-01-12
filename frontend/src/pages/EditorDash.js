import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import apiUrl from '../config/config';
import axios from 'axios';
import { saveAs } from 'file-saver';
import { BiLoaderCircle } from 'react-icons/bi';
import LoadingBar from 'react-top-loading-bar';
import background from '../media/editor.webp';
import { FaDownload } from "react-icons/fa";

function EditorDash() {
  const [config, setConfig] = useState({ denyThreshold: 0, latestVideoLink: '' });
  const [clips, setClips] = useState([]);
  const [ratings, setRatings] = useState({});
  const [downloading, setDownloading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [seasonInfo, setSeasonInfo] = useState({});
  const [zips, setZips] = useState([]);
  const [zipsLoading, setZipsLoading] = useState(true);

  useEffect(() => {
    fetchInitialData();
    fetchZips();
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
      setZipsLoading(false);
    }
  };

  const deniedClips = clips.filter(clip => {
    const ratingData = ratings[clip._id];
    return ratingData && ratingData.ratingCounts.some(rateData => rateData.rating === 'deny' && rateData.count >= config.denyThreshold);
  }).length;

  const processClips = async () => {
    if (!window.confirm("Are you sure you want to process these clips?")) {
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
      const response = await axios.post(
        `${apiUrl}/api/zips/process`,
        {
          clips: filteredClips.map((clip) => {
            const ratingData = ratings[clip._id];
            const mostChosenRating = ratingData.ratingCounts.reduce(
              (max, rateData) => (rateData.count > max.count ? rateData : max),
              ratingData.ratingCounts[0]
            );
            return { ...clip, rating: mostChosenRating.rating };
          }),
          season: seasonInfo.season,
        },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
          withCredentials: true
        }
      );

      if (response.status !== 200) {
        throw new Error('Failed to process clips');
      }

      alert('Zipped clips stored in DB successfully!');
      fetchZips();
    } catch (error) {
      console.error('Error processing clips:', error);
    } finally {
      setDownloading(false);
      setDownloadProgress(0);
    }
  };

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

  return (
    <div className="min-h-screen text-white flex flex-col items-center bg-neutral-200 dark:bg-neutral-900 transition duration-200">
      <Helmet>
        <title>Editor Dash</title>
        <meta name="description" description="ClipSesh! is a site for Beat Saber players by Beat Saber players. On this site you will be able to view all submitted clips" />
      </Helmet>
      <div className='w-full'>
        <LoadingBar color='#f11946' progress={progress} onLoaderFinished={() => setProgress(0)} />
      </div>
      <div className="w-full flex h-96 justify-center items-center animate-fade" style={{ backgroundImage: `url(${background})`, backgroundSize: 'cover', backgroundPosition: 'center', clipPath: 'polygon(0 0, 100% 0, 100% 80%, 0 100%)' }}>
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
              <h2 className="text-3xl font-bold mb-4">Available Zips</h2>
              {zipsLoading ? (
                <div className="flex justify-center items-center">
                  <BiLoaderCircle className="animate-spin text-4xl" />
                </div>
              ) : zips.length === 0 ? (
                <p>No zips available.</p>
              ) : (
                <ul className="space-y-4">
                  {zips.map(zip => (
                    <li key={zip._id} className="flex justify-between items-center bg-neutral-400 dark:bg-neutral-700 p-4 rounded-md">
                      <div className="flex flex-col gap-2">
                        <h2>{zip.season}</h2>
                        <p className='text-neutral-300'>{zip.name}</p>
                        <div className="flex gap-2">
                          <p className='text-neutral-300'>{zip.clipAmount} clips</p>
                          <p className='text-neutral-300'>{(zip.size / 1000000).toFixed(2)} MB</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => { saveAs(zip.url); }}
                          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md"
                        >
                          <FaDownload />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default EditorDash;
