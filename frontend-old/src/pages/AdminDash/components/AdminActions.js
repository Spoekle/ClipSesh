import React from 'react';
import { motion } from 'framer-motion';
import { BiLoaderCircle } from 'react-icons/bi';
import { FaTrash, FaArchive } from 'react-icons/fa';

const AdminActions = ({ processClips, handleDeleteAllClips, downloading }) => {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      className="col-span-1 w-full bg-neutral-300 dark:bg-neutral-800 text-neutral-900 dark:text-white transition duration-200 p-6 md:p-8 rounded-xl shadow-lg hover:shadow-xl"
    >
      <h2 className="text-2xl md:text-3xl font-bold mb-6 border-b pb-3 border-neutral-400 dark:border-neutral-700 flex items-center">
        <svg className="mr-3 w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
        </svg>
        Admin Actions
      </h2>
      
      <div className="flex flex-col gap-6">
        <div className="bg-neutral-200 dark:bg-neutral-700 rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-2 flex items-center">
            <FaArchive className="mr-2 text-green-500" /> Process Rated Clips
          </h3>
          <p className="text-neutral-600 dark:text-neutral-400 text-sm mb-4">
            Create a zip file from all approved clips for download. This excludes clips that have been denied by users.
          </p>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={processClips}
            disabled={downloading}
            className="w-full bg-green-500 hover:bg-green-600 text-white font-medium py-3 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 transition duration-200 flex justify-center items-center"
          >
            {downloading ? (
              <>
                <BiLoaderCircle className="animate-spin mr-2" />
                Processing Clips...
              </>
            ) : (
              <>
                Process Clips
              </>
            )}
          </motion.button>
        </div>
        
        <div className="bg-neutral-200 dark:bg-neutral-700 rounded-lg p-4">
          <h3 className="text-lg font-semibold mb-2 flex items-center">
            <FaTrash className="mr-2 text-red-500" /> Reset Database
          </h3>
          <p className="text-neutral-600 dark:text-neutral-400 text-sm mb-4">
            <strong>Warning:</strong> This action will permanently delete all clips from the database. This cannot be undone.
          </p>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleDeleteAllClips}
            className="w-full bg-red-500 hover:bg-red-600 text-white font-medium py-3 px-4 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 transition duration-200"
          >
            Reset Database
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};

export default AdminActions;
