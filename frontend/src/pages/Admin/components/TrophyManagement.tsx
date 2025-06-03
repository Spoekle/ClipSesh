import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import apiUrl from '../../../config/config';
import axios from 'axios';
import {
  FaTrophy,
  FaPlus,
  FaEdit,
  FaTrash,
  FaTimes,
  FaCheck,
} from 'react-icons/fa';
import ConfirmationDialog from '../../../components/common/ConfirmationDialog';

interface Trophy {
  _id: string;
  trophyName: string;
  description: string;
  dateEarned: string;
}

interface User {
  _id: string;
  username: string;
  roles: string[];
  trophies?: Trophy[];
}

interface TrophyManagementProps {
  users: User[];
  onRefreshUsers: () => void;
}

const TrophyManagement: React.FC<TrophyManagementProps> = ({ users, onRefreshUsers }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedTrophy, setSelectedTrophy] = useState<Trophy | null>(null);
  const [formData, setFormData] = useState({
    trophyName: '',
    description: '',
    season: '',
    year: new Date().getFullYear(),
  });
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false);
  const [trophyToDelete, setTrophyToDelete] = useState<{ userId: string; trophyId: string } | null>(null);

  const seasons = ['Spring', 'Summer', 'Fall', 'Winter'];
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 10 }, (_, i) => currentYear - i);

  // Filter users to show clipteam members who have trophies
  const clipteamUsersWithTrophies = users.filter(user => 
    user.roles.includes('clipteam') && user.trophies && user.trophies.length > 0
  );

  // All clipteam users for dropdown selection
  const clipteamUsers = users.filter(user => 
    user.roles.includes('clipteam')
  );

  const handleOpenModal = (user?: User, trophy?: Trophy) => {
    setSelectedUser(user || null);
    setSelectedTrophy(trophy || null);
    setEditMode(!!trophy);
    
    if (trophy) {
      // Parse dateEarned to extract season and year
      const [season, year] = trophy.dateEarned.split(' ');
      setFormData({
        trophyName: trophy.trophyName,
        description: trophy.description,
        season: season || '',
        year: parseInt(year) || currentYear,
      });
    } else {
      setFormData({
        trophyName: '',
        description: '',
        season: '',
        year: currentYear,
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedUser(null);
    setSelectedTrophy(null);
    setEditMode(false);
    setIsDropdownOpen(false);
    setFormData({
      trophyName: '',
      description: '',
      season: '',
      year: currentYear,
    });
  };

  const showAlert = (type: 'success' | 'error', message: string) => {
    setAlert({ type, message });
    setTimeout(() => setAlert(null), 5000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedUser || !formData.trophyName || !formData.description || !formData.season) {
      showAlert('error', 'Please fill in all required fields');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const url = editMode 
        ? `${apiUrl}/api/admin/users/${selectedUser._id}/trophies/${selectedTrophy?._id}`
        : `${apiUrl}/api/admin/users/${selectedUser._id}/trophies`;
      
      const config = {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      };

      const response = editMode 
        ? await axios.put(url, formData, config)
        : await axios.post(url, formData, config);

      if (response.data.success) {
        showAlert('success', editMode ? 'Trophy updated successfully' : 'Trophy awarded successfully');
        handleCloseModal();
        onRefreshUsers();
      } else {
        showAlert('error', response.data.message || 'Failed to save trophy');
      }
    } catch (error: any) {
      console.error('Error saving trophy:', error);
      showAlert('error', error.response?.data?.message || 'An error occurred while saving the trophy');
    }
  };

  const handleDeleteTrophy = async (userId: string, trophyId: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.delete(`${apiUrl}/api/admin/users/${userId}/trophies/${trophyId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.data.success) {
        showAlert('success', 'Trophy removed successfully');
        onRefreshUsers();
      } else {
        showAlert('error', response.data.message || 'Failed to remove trophy');
      }
    } catch (error: any) {
      console.error('Error removing trophy:', error);
      showAlert('error', error.response?.data?.message || 'An error occurred while removing the trophy');
    }
  };

  const handleDeleteClick = (userId: string, trophyId: string) => {
    setTrophyToDelete({ userId, trophyId });
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = () => {
    if (trophyToDelete) {
      handleDeleteTrophy(trophyToDelete.userId, trophyToDelete.trophyId);
    }
    setShowDeleteConfirm(false);
    setTrophyToDelete(null);
  };

  const handleCancelDelete = () => {
    setShowDeleteConfirm(false);
    setTrophyToDelete(null);
  };

  return (
    <div className="space-y-6">
      {/* Alert */}
      <AnimatePresence>
        {alert && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`p-4 rounded-lg border ${
              alert.type === 'success' 
                ? 'bg-green-100 border-green-300 text-green-800 dark:bg-green-900/20 dark:border-green-700 dark:text-green-400'
                : 'bg-red-100 border-red-300 text-red-800 dark:bg-red-900/20 dark:border-red-700 dark:text-red-400'
            }`}
          >
            <div className="flex justify-between items-center">
              <span>{alert.message}</span>
              <button
                onClick={() => setAlert(null)}
                className="text-current opacity-70 hover:opacity-100"
              >
                <FaTimes />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold text-neutral-900 dark:text-white flex items-center gap-3">
          <FaTrophy className="text-yellow-500" />
          Trophy Management
        </h2>
        <button
          onClick={() => handleOpenModal()}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
        >
          <FaPlus />
          Award Trophy
        </button>
      </div>

      {/* User Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {clipteamUsersWithTrophies.map((user) => (
          <motion.div
            key={user._id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-neutral-300 dark:bg-neutral-800 rounded-xl p-4 shadow-lg hover:shadow-xl transition-all"
          >
            <div className="flex justify-between items-center mb-3">
              <h3 className="text-lg font-semibold text-neutral-900 dark:text-white">
                {user.username}
              </h3>
              <button
                onClick={() => handleOpenModal(user)}
                className="bg-green-600 hover:bg-green-700 text-white px-2 py-1 rounded-md text-xs flex items-center gap-1 transition-colors"
              >
                <FaPlus size={10} />
                Add
              </button>
            </div>

            <div className="space-y-2 max-h-48 overflow-y-auto">
              {user.trophies!.map((trophy) => (
                <div
                  key={trophy._id}
                  className="bg-neutral-200 dark:bg-neutral-700 rounded-lg p-2 group relative"
                  title={trophy.description}
                >
                  <div className="flex justify-between items-start mb-1">
                    <h4 className="font-semibold text-neutral-900 dark:text-white text-xs">
                      {trophy.trophyName}
                    </h4>
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleOpenModal(user, trophy)}
                        className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                      >
                        <FaEdit size={10} />
                      </button>
                      <button
                        onClick={() => handleDeleteClick(user._id, trophy._id)}
                        className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                      >
                        <FaTrash size={10} />
                      </button>
                    </div>
                  </div>
                  
                  {/* Description tooltip - visible on hover */}
                  <div className="absolute left-0 bottom-full mb-2 w-48 bg-black text-white text-xs rounded-lg px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10">
                    {trophy.description}
                    <div className="absolute top-full left-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-black"></div>
                  </div>
                  
                  <span className="inline-block bg-yellow-500 text-black px-2 py-1 rounded-full text-xs font-semibold">
                    {trophy.dateEarned}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={handleCloseModal}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-neutral-100 dark:bg-neutral-800 rounded-xl p-6 w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-neutral-900 dark:text-white">
                  {editMode ? 'Edit Trophy' : 'Award Trophy'}
                  {selectedUser && ` - ${selectedUser.username}`}
                </h3>
                <button
                  onClick={handleCloseModal}
                  className="text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200"
                >
                  <FaTimes />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* User Selection */}
                {!editMode && (
                  <div className="relative">
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                      Select User *
                    </label>
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                        className="w-full p-3 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white text-left flex justify-between items-center"
                      >
                        <span>{selectedUser?.username || 'Select a user'}</span>
                        <span className={`transform transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`}>
                          ▼
                        </span>
                      </button>
                      
                      {isDropdownOpen && (
                        <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-neutral-700 border border-neutral-300 dark:border-neutral-600 rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto">
                          {clipteamUsers.map((user) => (
                            <button
                              key={user._id}
                              type="button"
                              onClick={() => {
                                setSelectedUser(user);
                                setIsDropdownOpen(false);
                              }}
                              className="w-full p-3 text-left hover:bg-neutral-100 dark:hover:bg-neutral-600 text-neutral-900 dark:text-white"
                            >
                              {user.username}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Trophy Name */}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                    Trophy Name *
                  </label>
                  <input
                    type="text"
                    value={formData.trophyName}
                    onChange={(e) => setFormData({ ...formData, trophyName: e.target.value })}
                    className="w-full p-3 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white"
                    required
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                    Description *
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                    className="w-full p-3 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white resize-none"
                    required
                  />
                </div>

                {/* Season and Year */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                      Season *
                    </label>
                    <select
                      value={formData.season}
                      onChange={(e) => setFormData({ ...formData, season: e.target.value })}
                      className="w-full p-3 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white"
                      required
                    >
                      <option value="">Select season</option>
                      {seasons.map((season) => (
                        <option key={season} value={season}>
                          {season}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
                      Year *
                    </label>
                    <select
                      value={formData.year}
                      onChange={(e) => setFormData({ ...formData, year: Number(e.target.value) })}
                      className="w-full p-3 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white"
                      required
                    >
                      {years.map((year) => (
                        <option key={year} value={year}>
                          {year}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Buttons */}
                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="flex-1 bg-neutral-500 hover:bg-neutral-600 text-white py-2 px-4 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    <FaCheck />
                    {editMode ? 'Update' : 'Award'} Trophy
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Delete Trophy Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={showDeleteConfirm}
        title="Delete Trophy"
        message="Are you sure you want to delete this trophy? This action cannot be undone."
        confirmText="Delete"
        confirmVariant="danger"
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
      />
    </div>
  );
};

export default TrophyManagement;
