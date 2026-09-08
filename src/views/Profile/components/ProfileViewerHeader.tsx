import { motion } from 'framer-motion';
import { Link } from '@/lib/routerCompat';
import { FaHome } from 'react-icons/fa';
import { getUserAvatarUrl } from '@/utils/generateAvatar';

interface ProfileViewerHeaderProps {
  username?: string;
  profilePicture?: string;
}

const ProfileViewerHeader = ({ username, profilePicture }: ProfileViewerHeaderProps) => {
  const ambientAvatar = getUserAvatarUrl(username, profilePicture, 128);

  return (
    <div className="relative py-7 md:py-8 border-b border-[#262626] bg-[#121212]/90 overflow-hidden">
      {/* Ambient profile glow in background */}
      {ambientAvatar && (
        <div 
          className="absolute inset-0 opacity-10 blur-3xl scale-125 pointer-events-none"
          style={{
            backgroundImage: `url(${ambientAvatar})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
      )}
      
      <div className="relative max-w-300 mx-auto px-4 sm:px-8">
        {/* Breadcrumbs */}
        <nav className="flex items-center gap-2 text-xs text-[#717171] mb-3">
          <Link to="/" className="hover:text-[#f1f1f1] transition-colors flex items-center gap-1.5">
            <FaHome size={11} className="text-[#717171]" />
            <span>Home</span>
          </Link>
          <span className="text-[#333333] select-none">/</span>
          <span className="text-[#aaaaaa]">Profile</span>
          {username && (
            <>
              <span className="text-[#333333] select-none">/</span>
              <span className="text-[#f1f1f1] font-medium truncate max-w-50">{username}</span>
            </>
          )}
        </nav>

        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="inline-block"
        >
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight text-[#f1f1f1]">
            {username ? `${username}'s Profile` : 'User Profile'}
          </h1>
          <div className="mt-2 w-12 h-0.5 bg-cc-red rounded-full" />
        </motion.div>
      </div>
    </div>
  );
};

export default ProfileViewerHeader;
