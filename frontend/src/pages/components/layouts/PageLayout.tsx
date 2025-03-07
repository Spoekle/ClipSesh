import React from 'react';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet';

interface PageLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  backgroundImage?: string;
  metaDescription?: string;
  headerComponent?: React.ReactNode;
  contentAnimationDelay?: number;
}

const PageLayout = ({ 
  children, 
  title, 
  subtitle,
  backgroundImage, 
  metaDescription,
  headerComponent,
  contentAnimationDelay = 0.3
}: PageLayoutProps) => {
  return (
    <div className="min-h-screen text-white flex flex-col items-center bg-neutral-200 dark:bg-neutral-900 transition duration-200">
      <Helmet>
        <title>{title} | ClipSesh</title>
        <meta name="description" content={metaDescription || title} />
      </Helmet>
      
      {backgroundImage ? (
        <div 
          className="w-full flex h-96 justify-center items-center animate-fade"
          style={{ 
            backgroundImage: `url(${backgroundImage})`, 
            backgroundSize: 'cover', 
            backgroundPosition: 'center', 
            clipPath: 'polygon(0 0, 100% 0, 100% 80%, 0 100%)' 
          }}
        >
          <div className="flex bg-gradient-to-b from-neutral-900/80 to-bg-black/40 backdrop-blur-md justify-center items-center w-full h-full">
            <div className="flex flex-col justify-center items-center px-4 md:px-0">
              <motion.h1 
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="text-4xl md:text-5xl font-bold mb-4 text-center text-white drop-shadow-lg"
              >
                {title}
              </motion.h1>
              {subtitle && (
                <motion.h2
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  className="text-2xl md:text-3xl mb-4 text-center text-white/90 drop-shadow-md"
                >
                  {subtitle}
                </motion.h2>
              )}
              
              {headerComponent && headerComponent}
            </div>
          </div>
        </div>
      ) : null}
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: contentAnimationDelay }}
        className="container px-4 md:px-8 pt-16 pb-12 bg-neutral-200 dark:bg-neutral-900 transition duration-200 text-white justify-center justify-items-center w-full"
      >
        {children}
      </motion.div>
    </div>
  );
};

export default PageLayout;
