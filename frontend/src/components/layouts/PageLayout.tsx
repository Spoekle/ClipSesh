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
    <div className="min-h-screen flex flex-col bg-neutral-100 dark:bg-neutral-900 transition duration-200 overflow-hidden mx-6">
      <Helmet>
        <title>{title} | ClipSesh</title>
        <meta name="description" content={metaDescription || title} />
      </Helmet>

      {backgroundImage ? (
        <div
          className="w-full flex h-[500px] justify-center items-center rounded-b-4xl overflow-hidden relative animate-fade"
          style={{
            backgroundImage: `url(${backgroundImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        >
          <div className="flex bg-gradient-to-b from-black/70 via-black/50 to-black/30 dark:from-neutral-900/80 dark:to-black/40 backdrop-blur-md justify-center items-center w-full h-full">
            <div className="flex flex-col justify-center items-center px-4 md:px-0 w-full">
              <motion.h1
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="text-7xl sm:text-8xl md:text-9xl font-black text-white leading-tight mb-4 text-center drop-shadow-lg"
              >
                {title.toUpperCase()}
              </motion.h1>
              {subtitle && (
                <motion.h2
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  className="text-2xl sm:text-3xl md:text-4xl font-light text-neutral-300 max-w-3xl mx-auto leading-relaxed mb-4 text-center drop-shadow-md"
                >
                  {subtitle}
                </motion.h2>
              )}

              {headerComponent && headerComponent}
            </div>
          </div>
        </div>
      ) : null}

      <motion.main
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: contentAnimationDelay }}
        className="flex-grow w-full px-4 md:px-8 pt-16 pb-12 bg-neutral-100 dark:bg-neutral-900 transition duration-200 text-neutral-800 dark:text-white overflow-hidden"
      >
        {children}
      </motion.main>
    </div>
  );
};

export default PageLayout;
