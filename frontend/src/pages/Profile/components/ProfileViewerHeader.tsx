import { motion } from 'framer-motion';
import { FaUser } from 'react-icons/fa';

interface ProfileViewerHeaderProps {
    username?: string;
    profilePicture?: string;
}

const ProfileViewerHeader = ({ username, profilePicture }: ProfileViewerHeaderProps) => {
    return (
        <div className="relative h-[300px] md:h-[400px] w-full rounded-b-4xl overflow-hidden">
            {/* Background image layer - uses profile picture */}
            <div
                className="absolute inset-0"
                style={{
                    backgroundImage: profilePicture ? `url(${profilePicture})` : undefined,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundColor: !profilePicture ? '#1f2937' : undefined,
                }}
            />

            {/* Gradient overlay with stronger blur for profile pics */}
            <div
                className="absolute inset-0 backdrop-blur-xl"
                style={{
                    background: 'linear-gradient(to bottom, rgba(0,0,0,0.75), rgba(0,0,0,0.6), rgba(0,0,0,0.4))',
                }}
            />

            {/* Content layer */}
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative z-10 flex h-full w-full justify-center items-center"
            >
                <div className="flex flex-col justify-center items-center px-4 md:px-0 w-full">
                    <motion.h1
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2, duration: 0.5 }}
                        className="text-7xl sm:text-8xl md:text-9xl font-black text-white leading-tight mb-4 text-center drop-shadow-lg"
                    >
                        {username || 'PROFILE'}'s
                    </motion.h1>

                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3, duration: 0.5 }}
                        className="text-2xl sm:text-3xl md:text-4xl font-light text-neutral-300 max-w-3xl mx-auto leading-relaxed mb-4 text-center drop-shadow-md"
                    >
                        Profile
                    </motion.h2>
                </div>
            </motion.div>
        </div>
    );
};

export default ProfileViewerHeader;

