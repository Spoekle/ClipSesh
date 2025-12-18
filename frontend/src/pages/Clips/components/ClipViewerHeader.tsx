import { motion } from 'framer-motion';

import winterImg from '../../../media/winter.webp';
import springImg from '../../../media/spring.jpg';
import summerImg from '../../../media/summer.jpg';
import fallImg from '../../../media/fall.jpg';


type Season = 'Winter' | 'Spring' | 'Summer' | 'Fall';

interface ClipViewerHeaderProps {
  season: Season;
  totalClips?: number;
  isFiltered?: boolean;
}

const ClipViewerHeader = ({ season, totalClips, isFiltered }: ClipViewerHeaderProps) => {

  const seasonImages: Record<Season, string> = {
    'Winter': winterImg,
    'Spring': springImg,
    'Summer': summerImg,
    'Fall': fallImg,
  };

  const getBackgroundImage = () => {
    return seasonImages[season] || winterImg;
  };

  return (
    <div className="relative h-[500px] w-full rounded-b-4xl overflow-hidden mx-6">
      {/* Background image layer */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `url(${getBackgroundImage()})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />

      {/* Gradient overlay */}
      <div
        className="absolute inset-0 backdrop-blur-md"
        style={{
          background: 'linear-gradient(to bottom, rgba(0,0,0,0.7), rgba(0,0,0,0.5), rgba(0,0,0,0.3))',
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
            CLIP VIEWER
          </motion.h1>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="text-2xl sm:text-3xl md:text-4xl font-light text-neutral-300 max-w-3xl mx-auto leading-relaxed mb-4 text-center drop-shadow-md"
          >
            Discover and rate the best clips!
          </motion.h2>

          {/* Clips count */}
          {totalClips !== undefined && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-lg text-center text-white/80 bg-black/40 px-4 py-2 rounded-lg"
            >
              {isFiltered ? (
                <>
                  <span className="font-semibold">{totalClips.toLocaleString()}</span> clips found
                </>
              ) : (
                <>
                  <span className="font-semibold">{totalClips.toLocaleString()}</span> clips available
                </>
              )}
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default ClipViewerHeader;
