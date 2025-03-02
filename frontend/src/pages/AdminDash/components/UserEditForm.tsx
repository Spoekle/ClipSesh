import React from 'react';
import { motion } from 'framer-motion';
import { FaCheck, FaTimes } from 'react-icons/fa';
import { User } from '../../../types/adminTypes';

interface UserEditFormProps {
  editUser: User | null;
  handleEditChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleEditSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  setEditUser: React.Dispatch<React.SetStateAction<User | null>>;
  isLoading: boolean;
  AVAILABLE_ROLES: string[];
}

const UserEditForm: React.FC<UserEditFormProps> = ({ 
  editUser, 
  handleEditChange, 
  handleEditSubmit, 
  setEditUser, 
  isLoading,
  AVAILABLE_ROLES 
}) => {
  if (!editUser) return null;
  
  return (
    <div className="fixed inset-0 z-50 overflow-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ type: "spring", duration: 0.4 }}
        className="bg-neutral-300 dark:bg-neutral-800 rounded-xl shadow-2xl max-w-md w-full mx-auto"
      >
        <div className="p-5 border-b border-neutral-400 dark:border-neutral-600 flex justify-between items-center">
          <h3 className="text-xl font-bold">Edit User: {editUser.username}</h3>
          <button 
            onClick={() => setEditUser(null)}
            className="p-1 rounded-full hover:bg-neutral-400 dark:hover:bg-neutral-700 transition-colors"
          >
            <FaTimes />
          </button>
        </div>
        <div className="p-5">
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div>
              <label htmlFor="username" className="block text-sm font-medium mb-1">Username:</label>
              <input
                type="text"
                id="username"
                name="username"
                value={editUser.username}
                onChange={handleEditChange}
                className="w-full px-3 py-2 bg-neutral-200 dark:bg-neutral-700 border border-neutral-400 dark:border-neutral-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
            
            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-1">Email:</label>
              <input
                type="email"
                id="email"
                name="email"
                value={editUser.email || ''}
                onChange={handleEditChange}
                className="w-full px-3 py-2 bg-neutral-200 dark:bg-neutral-700 border border-neutral-400 dark:border-neutral-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium mb-1">
                Password (leave blank to keep unchanged):
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={editUser.password || ''}
                onChange={handleEditChange}
                className="w-full px-3 py-2 bg-neutral-200 dark:bg-neutral-700 border border-neutral-400 dark:border-neutral-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Roles:</label>
              <div className="grid grid-cols-2 gap-2">
                {[...AVAILABLE_ROLES].sort().map(role => (
                  <label key={role} className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      name="roles"
                      value={role}
                      checked={editUser.roles.includes(role)}
                      onChange={handleEditChange}
                      className="hidden"
                      disabled={editUser.roles.length === 1 && editUser.roles.includes(role)}
                    />
                    <div className={`w-5 h-5 rounded flex items-center justify-center ${
                      editUser.roles.includes(role) 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-neutral-400 dark:bg-neutral-600'
                    }`}>
                      {editUser.roles.includes(role) && <FaCheck className="text-xs" />}
                    </div>
                    <span className="capitalize">{role}</span>
                  </label>
                ))}
              </div>
            </div>
            
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEditUser(null)}
                className="px-4 py-2 bg-neutral-400 hover:bg-neutral-500 text-white rounded-md transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md flex items-center justify-center gap-2 transition-colors"
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Saving...
                  </>
                ) : (
                  <>
                    <FaCheck className="text-xs" />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
};

export default UserEditForm;
