import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FaWifi } from 'react-icons/fa';

interface OfflineBannerProps {
    isVisible: boolean;
}

const OfflineBanner: React.FC<OfflineBannerProps> = ({ isVisible }) => {
    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ opacity: 0, y: -100 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -100 }}
                    transition={{ duration: 0.3 }}
                    className="w-full bg-gradient-to-r from-orange-500 to-orange-600 text-white shadow-lg border-b-2 border-orange-400 relative z-[60]"
                >
                    <div className="container mx-auto px-4 py-3">
                        <div className="flex items-center justify-center space-x-3">
                            <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4">
                                <div className="flex items-center space-x-2">
                                    <FaWifi className="relative text-red-200" size={16} />
                                    <span className="font-medium">
                                        You're currently offline
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default OfflineBanner;
