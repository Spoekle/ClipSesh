import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { FaDiscord } from 'react-icons/fa';
import { SearchProfile } from '../../../types/searchTypes';
import { ReactNode } from 'react';

interface SearchProfileCardProps {
    profile: SearchProfile;
    index?: number;
    highlightSearchTerm: (text: string) => ReactNode;
}

const SearchProfileCard = ({ profile, index = 0, highlightSearchTerm }: SearchProfileCardProps) => {
    const navigate = useNavigate();

    const getRoleBadge = (role: string) => {
        const roleStyles: Record<string, string> = {
            admin: 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-200',
            editor: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-200',
            clipteam: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200',
            uploader: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-200',
        };
        return roleStyles[role] || 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200';
    };

    return (
        <motion.div
            key={profile._id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.05 }}
            className="bg-white/80 dark:bg-neutral-800/80 backdrop-blur-sm rounded-xl p-5 shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer group border border-neutral-200/50 dark:border-neutral-700/50"
            onClick={() => navigate(`/profile/${profile._id}`)}
        >
            <div className="flex items-start gap-4">
                <div className="relative">
                    <img
                        src={profile.profilePicture}
                        alt={profile.username}
                        className="w-16 h-16 rounded-full object-cover border-2 border-neutral-200 dark:border-neutral-600 group-hover:border-blue-400 transition-all duration-300 shadow-md"
                    />
                </div>

                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <h3 className="text-lg font-bold text-neutral-900 dark:text-white truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                            {highlightSearchTerm(profile.username)}
                        </h3>
                        {profile.roles && profile.roles.length > 0 && (
                            <div className="flex gap-1 flex-wrap">
                                {profile.roles.slice(0, 2).map((role) => (
                                    <span
                                        key={role}
                                        className={`px-2 py-0.5 rounded-full text-xs font-semibold ${getRoleBadge(role)}`}
                                    >
                                        {role.slice(0, 1).toUpperCase() + role.slice(1)}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>

                    {profile.discordUsername && (
                        <div className="flex items-center gap-2 mb-2">
                            <FaDiscord className="text-indigo-500" />
                            <span className="text-sm text-neutral-600 dark:text-neutral-400">
                                {profile.discordUsername}
                            </span>
                        </div>
                    )}

                    <div className="flex items-center justify-between text-sm text-neutral-500 dark:text-neutral-400">
                        <div className="flex items-center gap-3">
                            <span className="font-medium">{profile.stats.clipsSubmitted} clips</span>
                            <span className="text-neutral-400">•</span>
                            <span>Joined {new Date(profile.createdAt || profile.stats.joinDate).getFullYear()}</span>
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

export default SearchProfileCard;
