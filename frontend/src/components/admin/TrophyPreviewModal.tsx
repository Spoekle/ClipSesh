import React from 'react';
import { motion } from 'framer-motion';
import { FaTimes, FaTrophy, FaUser } from 'react-icons/fa';
import { TrophyPreviewResult, AllTrophyPreviewResult } from '../../types/adminTypes';

interface TrophyPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  previewData: TrophyPreviewResult | AllTrophyPreviewResult | null;
  isLoading: boolean;
  title: string;
}

const TrophyPreviewModal: React.FC<TrophyPreviewModalProps> = ({
  isOpen,
  onClose,
  previewData,
  isLoading,
  title
}) => {
  if (!isOpen) return null;

  const isSingleCriteria = previewData && 'winners' in previewData;
  const isAllCriteria = previewData && 'criteria' in previewData;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-white dark:bg-neutral-800 rounded-lg p-6 w-full max-w-4xl max-h-[80vh] overflow-y-auto mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold">{title}</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <FaTimes />
          </button>
        </div>

        {isLoading && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Loading preview...</p>
          </div>
        )}

        {!isLoading && !previewData && (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            <FaTrophy className="mx-auto text-4xl mb-4 opacity-50" />
            <p>No preview data available</p>
          </div>
        )}

        {!isLoading && isSingleCriteria && (
          <div className="space-y-4">
            <div className="bg-gray-50 dark:bg-neutral-700 rounded-lg p-4">
              <h3 className="font-semibold text-lg mb-2">{previewData.criteriaName}</h3>
              <div className="flex flex-wrap gap-2 text-sm">
                <span className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded">
                  {previewData.criteriaType}
                </span>
                <span className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-2 py-1 rounded">
                  {previewData.totalWinners} winners
                </span>
                {previewData.season && (
                  <span className="bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 px-2 py-1 rounded">
                    {previewData.season} {previewData.year}
                  </span>
                )}
              </div>
            </div>

            {previewData.error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-800 text-sm">{previewData.error}</p>
              </div>
            )}

            {previewData.winners.length === 0 && !previewData.error && (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <FaUser className="mx-auto text-3xl mb-2 opacity-50" />
                <p>No users meet the criteria requirements</p>
              </div>
            )}

            {previewData.winners.length > 0 && (
              <div className="space-y-3">
                <h4 className="font-medium text-gray-700 dark:text-gray-300">Winners:</h4>
                {previewData.winners.map((winner, index) => (
                  <div
                    key={winner.userId}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-neutral-700 rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center justify-center w-8 h-8 bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 rounded-full text-sm font-bold">
                        #{index + 1}
                      </div>
                      {winner.user?.profilePicture && (
                        <img
                          src={winner.user.profilePicture}
                          alt={winner.user.username}
                          className="w-8 h-8 rounded-full"
                        />
                      )}
                      <div>
                        <p className="font-medium">
                          {winner.user?.username || `User ${winner.userId}`}
                        </p>
                        {winner.user?.discordUsername && (
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Discord: {winner.user.discordUsername}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-lg">{winner.value.toFixed(2)}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">points</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {!isLoading && isAllCriteria && (
          <div className="space-y-6">
            <div className="bg-gray-50 dark:bg-neutral-700 rounded-lg p-4">
              <h3 className="font-semibold text-lg mb-2">
                Trophy Preview for {previewData.season} {previewData.year}
              </h3>
              <div className="flex flex-wrap gap-2 text-sm">
                <span className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded">
                  {previewData.totalCriteria} criteria
                </span>
                <span className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-2 py-1 rounded">
                  {previewData.totalTrophies} total trophies
                </span>
              </div>
            </div>

            {previewData.criteria.length === 0 && (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <FaTrophy className="mx-auto text-4xl mb-4 opacity-50" />
                <p>No active criteria found for this season</p>
              </div>
            )}

            <div className="space-y-4">
              {previewData.criteria.map((criteria) => (
                <div key={criteria.criteriaId} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold">{criteria.criteriaName}</h4>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {criteria.totalWinners} winners
                    </span>
                  </div>

                  {criteria.error && (
                    <div className="bg-red-50 border border-red-200 rounded p-2 mb-3">
                      <p className="text-red-800 text-xs">{criteria.error}</p>
                    </div>
                  )}

                  {criteria.winners.length > 0 && (
                    <div className="space-y-2">
                      {criteria.winners.slice(0, 3).map((winner, index) => (
                        <div
                          key={winner.userId}
                          className="flex items-center justify-between text-sm p-2 bg-gray-50 dark:bg-neutral-600 rounded"
                        >
                          <div className="flex items-center space-x-2">
                            <span className="text-yellow-600 font-bold">#{index + 1}</span>
                            {winner.user?.profilePicture && (
                              <img
                                src={winner.user.profilePicture}
                                alt={winner.user.username}
                                className="w-6 h-6 rounded-full"
                              />
                            )}
                            <span>{winner.user?.username || `User ${winner.userId}`}</span>
                          </div>
                          <span className="font-medium">{winner.value.toFixed(2)}</span>
                        </div>
                      ))}
                      {criteria.winners.length > 3 && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
                          ...and {criteria.winners.length - 3} more
                        </p>
                      )}
                    </div>
                  )}

                  {criteria.winners.length === 0 && !criteria.error && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-2">
                      No users meet the criteria
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex justify-end mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
          >
            Close
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default TrophyPreviewModal;
