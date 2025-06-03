import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import apiUrl from '../config/config';
import axios from 'axios';
import { 
  FaYoutube, 
  FaPlay, 
  FaArrowRight, 
  FaGamepad, 
  FaStar, 
  FaUsers, 
  FaLongArrowAltRight,
  FaDiscord,
  FaRocket,
} from 'react-icons/fa';
import { motion } from 'framer-motion';
import banner1 from '../media/banner1.png';

interface Config {
  latestVideoLink?: string;
  [key: string]: any;
}

function HomePage() {
  const [config, setConfig] = useState<Config>({
    // Default config values to prevent undefined errors
    latestVideoLink: 'https://www.youtube.com/watch?v=WQy7hb_jlCs',
  });
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);
  const [showVideo, setShowVideo] = useState(false);
  const [, setIsVideoPlaying] = useState(false);

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const response = await axios.get(`${apiUrl}/api/config/public`);
        if (response.data) {
          // Merge with defaults to ensure all required properties exist
          setConfig(prevConfig => ({
            ...prevConfig,
            ...response.data
          }));
        } else {
          console.warn('Config data is empty or malformed, using default values');
        }
      } catch (error) {
        console.error('Error fetching config:', error);
      }
    };

    fetchConfig();
    
    // Add scroll listener for animations
    const handleScroll = () => {
      const elements = document.querySelectorAll('.scroll-animate');
      
      elements.forEach(el => {
        const rect = el.getBoundingClientRect();
        const isInViewport = rect.top <= window.innerHeight * 0.8;
        
        if (isInViewport) {
          el.classList.add('fade-in-element');
        }
      });
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleVideoLoad = () => {
    setIsVideoLoaded(true);
    setIsVideoPlaying(true);
  };

  const getYoutubeId = (url: string | undefined): string | null => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const videoId = config.latestVideoLink ? getYoutubeId(config.latestVideoLink) : null;
  const embedUrl = videoId ? `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&controls=0&showinfo=0&rel=0&loop=1&playlist=${videoId}` : null;
  const thumbnailUrl = videoId ? `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg` : banner1;

  // Animation variants
  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: (custom: any) => ({
      opacity: 1,
      y: 0,
      transition: { delay: custom * 0.2, duration: 0.6 }
    })
  };

  // Steps for the "How it works" section
  const howItWorksSteps = [
    {
      title: "Browse Clips",
      description: "Explore a variety of Beat Saber clips submitted by players from around the world.",
      icon: <FaGamepad className="text-4xl text-blue-500" />
    },
    {
      title: "Rate & Discuss",
      description: "Vote on clips and join discussions about techniques, funny moments, and stunning gameplay.",
      icon: <FaStar className="text-4xl text-amber-500" />
    },
    {
      title: "Shape the Highlights",
      description: "Your ratings help determine which clips make it into the official highlights.",
      icon: <FaYoutube className="text-4xl text-red-500" />
    }
  ];

  // Scroll to next section helper
  const scrollToNextSection = () => {
    const featuresSection = document.getElementById('features');
    featuresSection?.scrollIntoView({ behavior: 'smooth' });
  };

  // How it Works steps animation
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2
      }
    }
  };
  
  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { 
      opacity: 1, 
      y: 0,
      transition: {
        duration: 0.5
      }
    }
  };

  // Community stats
  const communityStats = [
    {
      number: '9000+',
      label: 'Active Users',
      icon: <FaUsers className="text-blue-500" />
    },
    {
      number: '1000+',
      label: 'Rated Clips',
      icon: <FaGamepad className="text-red-500" />
    },
    {
      number: '10M+',
      label: 'YouTube Views',
      icon: <FaYoutube className="text-purple-500" />
    }
  ];

  return (
    <div className="min-h-screen bg-neutral-100 dark:bg-neutral-900 text-neutral-900 dark:text-white">
      <Helmet>
        <title>ClipSesh | Discover and Rate Beat Saber Highlights</title>
        <meta
          name="description"
          content="ClipSesh is a community platform for Beat Saber players to discover, rate, and discuss the best clips from the community. Join now and be part of the highlights!"
        />
      </Helmet>

      {/* Hero Section with Video Background */}
      <section className="relative w-full h-screen overflow-hidden">
        {/* Background - either video or image */}
        <div className="absolute inset-0 w-full h-full">
          {showVideo && embedUrl ? (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: isVideoLoaded ? 1 : 0 }}
              transition={{ duration: 0.8 }}
              className="relative w-full h-full"
            >
              <iframe
                className="absolute w-full h-full object-cover"
                src={embedUrl}
                frameBorder="0"
                allowFullScreen
                allow="autoplay"
                title="Latest YouTube Video"
                onLoad={handleVideoLoad}
              />
              {!isVideoLoaded && (
                <div className="absolute inset-0 bg-black flex items-center justify-center">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                    className="w-16 h-16 border-4 border-neutral-600 border-t-blue-500 rounded-full"
                  />
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div 
              initial={{ scale: 1.1 }}
              animate={{ scale: 1 }}
              transition={{ duration: 10, ease: "easeOut" }}
              className="w-full h-full bg-cover bg-center"
              style={{ backgroundImage: `url(${thumbnailUrl})` }}
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/80 backdrop-filter backdrop-blur-sm"></div>
        </div>

        {/* Hero Content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-white z-10 px-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1 }}
            className="container max-w-5xl mx-auto text-center"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, type: "spring" }}
              className="mb-6 inline-block"
            >
              <h1 className="text-6xl md:text-7xl lg:text-8xl font-bold tracking-tight">
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-red-500">
                  ClipSesh!
                </span>
              </h1>
            </motion.div>
            
            <motion.p 
              custom={1}
              variants={fadeIn}
              initial="hidden"
              animate="visible"
              className="text-xl md:text-2xl text-neutral-200 max-w-3xl mx-auto mb-10 leading-relaxed"
            >
              Discover, rate, and discuss the best Beat Saber clips from the community. 
              Shape the future of Seasonal Highlights!
            </motion.p>
            
            <motion.div 
              custom={2}
              variants={fadeIn}
              initial="hidden"
              animate="visible"
              className="flex flex-wrap gap-4 justify-center"
            >
              <Link to="/clips">
                <motion.button 
                  whileHover={{ scale: 1.05 }} 
                  whileTap={{ scale: 0.95 }}
                  className="bg-cc-red hover:bg-red-600 text-white text-lg px-8 py-4 rounded-lg shadow-lg transition duration-200 flex items-center group"
                >
                  Browse Clips 
                  <FaArrowRight className="ml-2 transform group-hover:translate-x-1 transition-transform" />
                </motion.button>
              </Link>
              
              {!showVideo && videoId && (
                <motion.button 
                  whileHover={{ scale: 1.05 }} 
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowVideo(true)}
                  className="bg-neutral-800/80 hover:bg-neutral-700 backdrop-blur-sm text-white text-lg px-8 py-4 rounded-lg shadow-lg transition duration-200 flex items-center"
                >
                  <FaPlay className="mr-2" /> Play Latest Video
                </motion.button>
              )}
            </motion.div>
          </motion.div>
          
          {/* Scroll indicator */}
          <motion.div 
            onClick={scrollToNextSection}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ 
              delay: 1, 
              duration: 0.8, 
              repeat: Infinity, 
              repeatType: "reverse" 
            }}
            className="absolute bottom-8 cursor-pointer"
          >
            <div className="w-8 h-12 border-2 border-white rounded-full flex justify-center">
              <div className="w-1 h-3 bg-white rounded-full mt-2 animate-bounce"></div>
            </div>
            <p className="text-sm mt-2 text-center">Scroll Down</p>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 bg-white dark:bg-neutral-800 transition-colors duration-300">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-3xl md:text-4xl font-bold mb-12 text-center">
            A New Era for <span className="text-cc-red">Beat Saber Highlights</span>
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
              className="bg-neutral-100 dark:bg-neutral-700 rounded-xl p-6 shadow-lg"
            >
              <div className="w-14 h-14 bg-blue-500 rounded-full flex items-center justify-center mb-4">
                <FaGamepad className="text-white text-2xl" />
              </div>
              <h3 className="text-xl font-bold mb-3">Discover Amazing Clips</h3>
              <p className="text-neutral-700 dark:text-neutral-300">
                Browse through a curated collection of the most impressive Beat Saber plays from talented players across the community.
              </p>
            </motion.div>
            
            {/* Feature 2 */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              viewport={{ once: true }}
              className="bg-neutral-100 dark:bg-neutral-700 rounded-xl p-6 shadow-lg"
            >
              <div className="w-14 h-14 bg-cc-red rounded-full flex items-center justify-center mb-4">
                <FaStar className="text-white text-2xl" />
              </div>
              <h3 className="text-xl font-bold mb-3">Rate and Influence</h3>
              <p className="text-neutral-700 dark:text-neutral-300">
                Vote on your favorite clips and help determine which ones make it into the official Cube Community highlights video.
              </p>
            </motion.div>
            
            {/* Feature 3 */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              viewport={{ once: true }}
              className="bg-neutral-100 dark:bg-neutral-700 rounded-xl p-6 shadow-lg"
            >
              <div className="w-14 h-14 bg-indigo-500 rounded-full flex items-center justify-center mb-4">
                <FaUsers className="text-white text-2xl" />
              </div>
              <h3 className="text-xl font-bold mb-3">Join the Community</h3>
              <p className="text-neutral-700 dark:text-neutral-300">
                Comment on clips, discuss techniques, and connect with other Beat Saber enthusiasts from around the world.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 px-4 bg-gradient-to-br from-neutral-100 to-neutral-200 dark:from-neutral-900 dark:to-neutral-800 transition-colors duration-300">
        <div className="container mx-auto max-w-6xl">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="text-3xl md:text-4xl font-bold mb-4 text-center"
          >
            How <span className="text-blue-600 dark:text-blue-400">ClipSesh</span> Works
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            viewport={{ once: true }}
            className="text-center text-neutral-700 dark:text-neutral-300 mb-16 max-w-2xl mx-auto text-lg"
          >
            Our platform connects the Beat Saber community with a simple and engaging process
          </motion.p>
          
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-3 gap-10"
            variants={container}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
          >
            {howItWorksSteps.map((step, index) => (
              <motion.div 
                key={step.title} 
                className="relative"
                variants={item}
              >
                <div className="bg-white dark:bg-neutral-700 rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow border-t-4 border-blue-500 h-full flex flex-col">
                  <div className="absolute -top-10 left-1/2 transform -translate-x-1/2 w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center shadow-lg">
                    {step.icon}
                  </div>
                  
                  {index < howItWorksSteps.length - 1 && (
                    <div className="absolute top-20 -right-12 w-16 h-4 hidden md:flex items-center justify-center">
                      <FaLongArrowAltRight className="text-blue-500 text-3xl" />
                    </div>
                  )}
                  
                  <h3 className="text-xl font-bold mt-6 text-center mb-4">{step.title}</h3>
                  <p className="text-neutral-700 dark:text-neutral-300 text-center">{step.description}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
          
          <div className="mt-16 flex justify-center">
            <Link to="/clips">
              <motion.button 
                whileHover={{ scale: 1.05 }} 
                whileTap={{ scale: 0.95 }}
                className="bg-blue-600 hover:bg-blue-700 text-white text-lg px-8 py-4 rounded-lg shadow-lg transition duration-200 flex items-center gap-2"
              >
                Try It Now <FaRocket className="ml-1" />
              </motion.button>
            </Link>
          </div>
        </div>
      </section>

      {/* Latest Highlights Section */}
      <section className="py-20 px-4 bg-neutral-100 dark:bg-neutral-900 transition-colors duration-300">
        <div className="container mx-auto max-w-6xl">
          <h2 className="text-3xl md:text-4xl font-bold mb-12 text-center">
            Latest <span className="text-cc-red">Highlights</span>
          </h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7 }}
              viewport={{ once: true }}
            >
              <h3 className="text-2xl font-bold mb-4">Watch the Latest Compilation</h3>
              <p className="text-neutral-700 dark:text-neutral-300 mb-6">
                The Cube Community team creates seasonal highlight videos featuring the best-rated clips from our community. 
                Check out the latest compilation and see if your favorite clips made it in!
              </p>
              
              <Link to="https://www.youtube.com/@CubeCommunity" target="_blank" rel="noopener noreferrer">
                <button className="flex items-center bg-cc-red hover:bg-red-600 text-white px-6 py-3 rounded-lg shadow-lg transition transform duration-200 hover:scale-105">
                  Subscribe on YouTube <FaYoutube className="ml-2 text-xl" />
                </button>
              </Link>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7 }}
              viewport={{ once: true }}
              className="rounded-xl overflow-hidden shadow-xl"
            >
              {videoId ? (
                <div className="aspect-video">
                  <iframe
                    src={`https://www.youtube.com/embed/${videoId}`}
                    className="w-full h-full rounded-xl"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    title="Latest YouTube Video"
                  ></iframe>
                </div>
              ) : (
                <img src={banner1} alt="Cube Community" className="w-full rounded-xl" />
              )}
            </motion.div>
          </div>
        </div>
      </section>
      
      {/* Community Stats Section - New Addition */}
      <section className="py-20 px-4 bg-white dark:bg-neutral-800 transition-colors duration-300">
        <div className="container mx-auto max-w-6xl">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="text-3xl md:text-4xl font-bold mb-16 text-center"
          >
            Join Our <span className="text-cc-red">Thriving</span> Community
          </motion.h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {communityStats.map((stat, index) => (
              <motion.div 
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-neutral-100 dark:bg-neutral-700 rounded-xl p-8 shadow-lg text-center hover:shadow-xl transition-shadow"
              >
                <div className="flex justify-center mb-4 text-5xl">
                  {stat.icon}
                </div>
                <h3 className="text-4xl font-bold mb-2">{stat.number}</h3>
                <p className="text-neutral-700 dark:text-neutral-300 text-lg">{stat.label}</p>
              </motion.div>
            ))}
          </div>
          
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            viewport={{ once: true }}
            className="mt-16 bg-gradient-to-r from-neutral-200 to-neutral-100 dark:from-neutral-700 dark:to-neutral-600 p-8 rounded-xl shadow-lg text-center"
          >
            <div className="flex items-center justify-center mb-4">
              <FaDiscord className="text-indigo-500 text-4xl mr-3" />
              <h3 className="text-2xl font-bold">Join Our Discord Community</h3>
            </div>
            <p className="text-neutral-700 dark:text-neutral-300 mb-6 max-w-2xl mx-auto">
              Connect with other Beat Saber enthusiasts, get notified about new clips, 
              and participate in exclusive community events.
            </p>
            <a 
              href="https://discord.gg/dwe8mbC" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg shadow-md transition duration-200 font-medium"
            >
              <FaDiscord className="mr-2" /> Join Discord
            </a>
          </motion.div>
        </div>
      </section>
      
      {/* Testimonials - New Addition
      <section className="py-20 px-4 bg-neutral-100 dark:bg-neutral-900 transition-colors duration-300">
        <div className="container mx-auto max-w-6xl">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="text-3xl md:text-4xl font-bold mb-4 text-center"
          >
            What Players Are <span className="text-cc-red">Saying</span>
          </motion.h2>
          
          <motion.p 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            viewport={{ once: true }}
            className="text-center text-neutral-700 dark:text-neutral-300 mb-16 max-w-2xl mx-auto"
          >
            Don't just take our word for it - see what our community has to share
          </motion.p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                name: "SaberMaster",
                role: "Community Member",
                quote: "ClipSesh has completely changed how I discover new Beat Saber content. I love being part of the rating process!",
                avatar: "M"
              },
              {
                name: "RhythmSlice",
                role: "Content Creator",
                quote: "As a creator, getting my clips featured through ClipSesh has helped me grow my audience tremendously.",
                avatar: "R"
              },
              {
                name: "CubeSlasher",
                role: "Team Member",
                quote: "The quality of clips has improved dramatically since we started using community ratings to select highlights.",
                avatar: "C"
              }
            ].map((testimonial, index) => (
              <motion.div 
                key={testimonial.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="bg-white dark:bg-neutral-800 p-6 rounded-xl shadow-lg"
              >
                <div className="flex items-start mb-4">
                  <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-lg mr-4">
                    {testimonial.avatar}
                  </div>
                  <div>
                    <h4 className="font-bold text-lg">{testimonial.name}</h4>
                    <p className="text-blue-600 dark:text-blue-400 text-sm">{testimonial.role}</p>
                  </div>
                </div>
                <div className="text-neutral-700 dark:text-neutral-300">
                  <div className="text-2xl text-cc-red mb-2">❝</div>
                  <p className="italic">{testimonial.quote}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
      */}
      
      {/* Call to Action */}
      <section className="py-20 px-4 bg-gradient-to-br from-blue-600 to-indigo-800 text-white">
        <div className="container mx-auto max-w-4xl text-center">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="text-3xl md:text-4xl font-bold mb-6"
          >
            Ready to Join the Community?
          </motion.h2>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            viewport={{ once: true }}
            className="text-xl mb-8"
          >
            Start exploring, rating, and discussing the best Beat Saber clips today!
          </motion.p>
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            viewport={{ once: true }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Link to="/clips">
              <motion.button 
                whileHover={{ scale: 1.05 }} 
                whileTap={{ scale: 0.95 }}
                className="bg-white text-blue-600 text-xl font-bold px-10 py-4 rounded-lg shadow-lg transition transform duration-200 hover:bg-neutral-100 w-full sm:w-auto"
              >
                Get Started Now
              </motion.button>
            </Link>
            
            <a 
              href="https://discord.gg/dwe8mbC" 
              target="_blank" 
              rel="noopener noreferrer"
            >
              <motion.button 
                whileHover={{ scale: 1.05 }} 
                whileTap={{ scale: 0.95 }}
                className="bg-indigo-900/40 backdrop-blur-sm border border-white/30 hover:bg-indigo-800/60 text-white text-xl font-bold px-10 py-4 rounded-lg shadow-lg transition transform duration-200 flex items-center gap-2 w-full sm:w-auto"
              >
                <FaDiscord /> Join Discord
              </motion.button>
            </a>
          </motion.div>
        </div>
      </section>

      {/* Custom animation for slow zoom effect */}
      <style>
        {`
          @keyframes slowZoom {
            0% { transform: scale(1); }
            100% { transform: scale(1.1); }
          }
          .animate-slow-zoom {
            animation: slowZoom 20s ease-in-out infinite alternate;
          }
        `}
      </style>
    </div>
  );
}

export default HomePage;
