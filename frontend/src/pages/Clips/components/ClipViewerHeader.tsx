import { motion } from 'framer-motion';

import winterImg from '../../../media/winter.webp';
import springImg from '../../../media/spring.jpg';
import summerImg from '../../../media/summer.jpg';
import fallImg from '../../../media/fall.jpg';


type Season = 'Winter' | 'Spring' | 'Summer' | 'Fall';

interface ClipViewerHeaderProps {
  season: Season;
}

const ClipViewerHeader = ({ season }: ClipViewerHeaderProps) => {

  const seasonImages: Record<Season, string> = {
    'Winter': winterImg,
    'Spring': springImg,
    'Summer': summerImg,
    'Fall': fallImg,
  };

  const getBackgroundImage = () => {
    // Return the appropriate image or default to winter
    return seasonImages[season] || winterImg;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex h-96 w-full justify-center items-center drop-shadow-xl"
      style={{
        backgroundImage: `url(${getBackgroundImage()})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        clipPath: 'polygon(0 0, 100% 0, 100% 80%, 0 100%)',
      }}
    >
      <div className="flex bg-gradient-to-b from-neutral-900 to-bg-black/20 backdrop-blur-lg justify-center items-center w-full h-full">
        <div className="flex flex-col justify-center items-center">
          <motion.h1 
            initial={{ opacity: 0, y: -20 }} 
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-5xl font-bold mb-4 text-center text-white"
          >
            Clip Viewer
          </motion.h1>
          <motion.h2 
            initial={{ opacity: 0, y: -20 }} 
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-3xl mb-4 text-center text-white opacity-90"
          >
            Discover and rate the best clips!
          </motion.h2>
        </div>
      </div>
    </motion.div>
  );
};

export default ClipViewerHeader;
