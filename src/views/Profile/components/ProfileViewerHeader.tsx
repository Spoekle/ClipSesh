import { motion } from 'framer-motion';
import { Link } from '@/lib/routerCompat';
import { FaHome } from 'react-icons/fa';

interface ProfileViewerHeaderProps {
  username?: string;
  profilePicture?: string;
}

const ProfileViewerHeader = ({ username, profilePicture }: ProfileViewerHeaderProps) => {
  return (
    <div className="relative py-8 md:py-10 border-b border-[#263238] bg-radial from-[#161d21]/60 via-[#0b0b0b] to-[#0b0b0b] overflow-hidden">
      {/* Ambient profile glow in background if profile pic is present */}
      {profilePicture && (
        <div 
          className="absolute inset-0 opacity-15 blur-3xl scale-125 pointer-events-none"
          style={{
            backgroundImage: `url(${profilePicture})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        />
      )}
      
      <div className="relative max-w-[1200px] mx-auto px-4 sm:px-8">
        {/* CC Breadcrumbs */}
        <div className="flex items-center gap-2 text-xs text-[#8b98a5] mb-4">
          <Link to="/" className="hover:text-white transition-colors flex items-center gap-1.5">
            <FaHome size={12} className="text-[#8b98a5]" />
            Home
          </Link>
          <span className="text-[#626262]">/</span>
          <span className="text-[#8b98a5]">Profile</span>
          {username && (
            <>
              <span className="text-[#626262]">/</span>
              <span className="text-white font-medium truncate max-w-[200px]">{username}</span>
            </>
          )}
        </div>

        {/* CC Page Header with signature red underline */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="inline-block"
        >
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-tight text-white">
            {username ? `${username}'s Profile` : 'User Profile'}
          </h1>
          <div 
            className="mt-2 h-[2.3px] bg-[#f23030] rounded-full" 
            style={{ width: '60%' }} 
          />
        </motion.div>
      </div>
    </div>
  );
};

export default ProfileViewerHeader;


