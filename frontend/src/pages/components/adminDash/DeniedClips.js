import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FaArrowDown } from 'react-icons/fa';

const DeniedClips = ({ clips, ratings, config, location }) => {
    const [currentPage, setCurrentPage] = useState(1);
    const clipsPerPage = 9;

    const filteredClips = clips.filter(clip => {
        const ratingData = ratings[clip._id];
        return ratingData && ratingData.ratingCounts.some(rateData => rateData.rating === 'deny' && rateData.count >= config.denyThreshold);
    });

    const totalPages = Math.ceil(filteredClips.length / clipsPerPage);
    const indexOfLastClip = currentPage * clipsPerPage;
    const indexOfFirstClip = indexOfLastClip - clipsPerPage;
    const currentClips = filteredClips.slice(indexOfFirstClip, indexOfLastClip);

    const paginate = (pageNumber) => setCurrentPage(pageNumber);

    return (
        <div className="lg:col-span-3 md:col-span-2 col-span-1 w-full h-auto bg-neutral-300 dark:bg-neutral-800 text-neutral-900 dark:text-white transition duration-200 p-8 rounded-md shadow-md animate-fade animate-delay-[700ms] overflow-y-auto">
            <h2 className="text-3xl font-bold mb-4">Denied Clips</h2>
            <div className="grid lg:grid-cols-3 md:grid-cols-2 grid-cols-1 gap-4">
                {currentClips.map((clip, index) => {
                    const ratingData = ratings[clip._id];
                    const denyCount = ratingData.ratingCounts.find(rate => rate.rating === 'deny')?.count || 0;
                    return (
                        <Link
                            key={clip._id}
                            to={`/clips/${clip._id}`}
                            state={{ from: location }}
                            className={`flex items-center bg-white hover:bg-neutral-200 dark:bg-neutral-900 dark:hover:bg-neutral-700 rounded-md p-4 shadow-md animate-fade-left`}
                            style={{ animationDelay: `${index * 70}ms` }}
                        >
                            <video
                                src={clip.url}
                                className="h-24 aspect-video object-cover rounded-md mr-4"
                            />
                            <div className="flex-1">
                                <h1 className="text-xl font-semibold">{clip.title}</h1>
                                <p className="text-sm mt-1">Streamer: {clip.streamer}</p>
                                {clip.submitter !== 'Legacy(no data)' && (
                                    <p className="text-sm mt-1">Submitted by: {clip.submitter}</p>
                                )}
                                <div className="flex mt-2 space-x-2 text-sm">
                                    <p className='flex items-center text-red-500'>Denied: {denyCount}</p>
                                    <p className='flex items-center text-red-500'><FaArrowDown className='mr-1' /> {clip.downvotes}</p>
                                </div>
                            </div>
                        </Link>
                    );
                })}
            </div>
            <div className="flex justify-center mt-4 space-x-2">
                {Array.from({ length: totalPages }, (_, i) => (
                    <button
                        key={i + 1}
                        onClick={() => paginate(i + 1)}
                        className={`px-3 py-1 rounded ${
                            currentPage === i + 1
                                ? 'bg-blue-500 text-white'
                                : 'bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-200'
                        }`}
                    >
                        {i + 1}
                    </button>
                ))}
            </div>
        </div>
    );
};

export default DeniedClips;