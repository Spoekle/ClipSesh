import { motion } from 'framer-motion';
import { Link, useLocation } from 'react-router-dom';
import { FaPlay, FaArrowUp, FaArrowDown, FaCalendarAlt } from 'react-icons/fa';
import { format } from 'timeago.js';
import { Clip } from '../../../types/adminTypes';
import { ReactNode } from 'react';

interface SearchClipCardProps {
    clip: Clip;
    index?: number;
    highlightSearchTerm: (text: string) => ReactNode;
}

const SearchClipCard = ({ clip, index = 0, highlightSearchTerm }: SearchClipCardProps) => {
    const location = useLocation();

    return (
        <motion.div
            key={clip._id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
            className="bg-white/80 dark:bg-neutral-800/80 backdrop-blur-sm rounded-xl shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 group border border-neutral-200/50 dark:border-neutral-700/50"
        >
            <Link
                to={`/clips/${clip._id}`}
                state={{ from: location }}
                className="block relative aspect-video bg-neutral-200 dark:bg-neutral-900"
            >
                {clip.thumbnail ? (
                    <img
                        src={clip.thumbnail}
                        alt={clip.title}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        loading="lazy"
                    />
                ) : (
                    <video
                        src={clip.url}
                        className="w-full h-full object-cover"
                        poster={clip.thumbnail}
                        preload="none"
                        muted
                    />
                )}

                <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/50 transition-colors duration-300">
                    <div className="bg-white/20 backdrop-blur-sm p-4 rounded-full group-hover:scale-110 transition-transform duration-300 shadow-lg">
                        <FaPlay className="text-white text-xl" />
                    </div>
                </div>

                <div className="absolute top-3 left-3 bg-black/70 backdrop-blur-sm text-white text-sm px-3 py-1.5 rounded-lg font-medium">
                    {clip.streamer}
                </div>
            </Link>

            <div className="p-4">
                <h3 className="font-semibold text-neutral-900 dark:text-white mb-2 line-clamp-2 h-12 leading-6">
                    {highlightSearchTerm(clip.title)}
                </h3>

                <div className="flex items-center justify-between text-sm text-neutral-500 dark:text-neutral-400">
                    <div className="flex items-center gap-4">
                        <span className="flex items-center gap-1">
                            <FaArrowUp className="text-green-500" />
                            <span className="font-medium">{clip.upvotes}</span>
                        </span>
                        <span className="flex items-center gap-1">
                            <FaArrowDown className="text-red-500" />
                            <span className="font-medium">{clip.downvotes}</span>
                        </span>
                    </div>
                    <span className="flex items-center gap-1.5" title={new Date(clip.createdAt).toLocaleDateString()}>
                        <FaCalendarAlt className="text-neutral-400" />
                        {format(new Date(clip.createdAt))}
                    </span>
                </div>

                {clip.submitter !== 'Legacy(no data)' && (
                    <div className="text-xs text-neutral-500 dark:text-neutral-400 mt-3 pt-3 border-t border-neutral-200 dark:border-neutral-700 truncate">
                        Submitted by: <span className="font-medium text-neutral-700 dark:text-neutral-300">{clip.submitter}</span>
                    </div>
                )}
            </div>
        </motion.div>
    );
};

export default SearchClipCard;
