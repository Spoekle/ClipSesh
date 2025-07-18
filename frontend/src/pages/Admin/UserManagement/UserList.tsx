import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FaDiscord, 
  FaSearch, 
  FaFilter, 
  FaEdit, 
  FaBan, 
  FaChevronLeft, 
  FaChevronRight, 
  FaCheck, 
  FaTimes,
  FaUserShield,
  FaExclamationTriangle
} from 'react-icons/fa';
import { useNotification } from '../../../context/AlertContext';
import generateAvatar from '../../../utils/generateAvatar';
import UserEditForm from './UserEditForm';
import TrophyIndicator from './TrophyIndicator';
import { User } from '../../../types/adminTypes';
import ConfirmationDialog from '../../../components/common/ConfirmationDialog';

import { useAllUsers, useDisableUser, useUpdateUser } from '../../../hooks/useAdmin';

interface UserListProps {
  fetchUsers: () => void;
  disabledUsers: User[];
  setDisabledUsers: React.Dispatch<React.SetStateAction<User[]>>;
  AVAILABLE_ROLES: string[];
}

const UserList: React.FC<UserListProps> = ({ AVAILABLE_ROLES }) => {
  const [filter, setFilter] = useState<string>('all');
  const [search, setSearch] = useState<string>('');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [roleFilter, setRoleFilter] = useState<string[]>([]);
  const [showDisableConfirm, setShowDisableConfirm] = useState<boolean>(false);
  const [userToDisable, setUserToDisable] = useState<string | null>(null);
  const usersPerPage = 12;
  
  const { showSuccess, showError } = useNotification();
  
  const { data: allUsers = [], isLoading: loading, error } = useAllUsers();
  const disableUserMutation = useDisableUser();
  const updateUserMutation = useUpdateUser();
  
  const users = useMemo(() => 
    allUsers.filter((user: User) => user.status === 'active'), 
    [allUsers]
  );
  
  const allRoles = useMemo(() => {
    return [...new Set(
      users.flatMap(user => user.roles || [])
    )].sort();
  }, [users]);

  const toggleRoleFilter = (role: string) => {
    setRoleFilter(prev => 
      prev.includes(role)
        ? prev.filter(r => r !== role)
        : [...prev, role]
    );
    setCurrentPage(1);
  };

  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFilter(e.target.value);
    setCurrentPage(1);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value.toLowerCase());
    setCurrentPage(1);
  };

  const toggleEditUser = (user: User) => {
    if (editUser && editUser._id === user._id) {
      setEditUser(null);
    } else {
      setEditUser({ 
        ...user, 
        roles: user.roles || ['user'],
        password: ''
      });
    }
  };

  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!editUser) return;
    
    const { name, value, type, checked } = e.target;
    if (name === 'roles') {
      let updatedRoles = [...editUser.roles];
      if (checked) {
        updatedRoles.push(value);
      } else {
        updatedRoles = updatedRoles.filter(role => role !== value);
      }
      setEditUser({
        ...editUser,
        roles: updatedRoles.length ? updatedRoles : ['user']
      });
    } else {
      setEditUser({
        ...editUser,
        [name]: type === 'checkbox' ? checked : value
      });
    }
  };
  const handleDisableUser = async (userId: string) => {
    setIsLoading(true);
    try {
      await disableUserMutation.mutateAsync(userId);
      showSuccess('User disabled successfully');
    } catch (error: any) {
      console.error('Error disabling user:', error);
      showError('Error disabling user');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisableClick = (userId: string) => {
    setUserToDisable(userId);
    setShowDisableConfirm(true);
  };

  const handleConfirmDisable = () => {
    if (userToDisable) {
      handleDisableUser(userToDisable);
    }
    setShowDisableConfirm(false);
    setUserToDisable(null);
  };

  const handleCancelDisable = () => {
    setShowDisableConfirm(false);
    setUserToDisable(null);
  };

  const handleEditSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editUser) return;
    
    setIsLoading(true);    
    try {
      const dataToSubmit = { ...editUser };

      if (!dataToSubmit.password) {
        delete dataToSubmit.password;
      }

      await updateUserMutation.mutateAsync({ userId: editUser._id, updateData: dataToSubmit });
      
      showSuccess('User updated successfully');
      setEditUser(null);
    } catch (error: any) {
      console.error('Error updating user:', error);
      showError(error.response?.data?.message || 'Failed to update user');
    } finally {
      setIsLoading(false);
    }
  };
  
  const filteredUsers = users.filter(user => {
    if (filter !== 'all' && !user.roles.includes(filter)) {
      return false;
    }
    
    if (roleFilter.length > 0 && !roleFilter.some(role => user.roles.includes(role))) {
      return false;
    }
    
    if (search && !user.username.toLowerCase().includes(search.toLowerCase())) {
      return false;
    }
    
    return true;
  });

  const sortedUsers = [...filteredUsers].sort((a, b) => a.username.localeCompare(b.username));

  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = sortedUsers.slice(indexOfFirstUser, indexOfLastUser);
  const totalPages = Math.ceil(sortedUsers.length / usersPerPage);

  const getRoleColor = (role: string): string => {
    switch (role) {
      case 'admin': return 'bg-red-500 border-red-600';
      case 'clipteam': return 'bg-blue-500 border-blue-600';
      case 'editor': return 'bg-green-500 border-green-600';
      case 'uploader': return 'bg-yellow-500 border-yellow-600';
      default: return 'bg-gray-500 border-gray-600';
    }
  };

  const getPaginationButtons = () => {
    const buttons: (number | string)[] = [];
    const maxButtonsToShow = 5;
    
    if (totalPages <= maxButtonsToShow) {
      for (let i = 1; i <= totalPages; i++) {
        buttons.push(i);
      }
    } else {
      buttons.push(1);
      
      if (currentPage < 4) {
        buttons.push(2, 3, 4, '...', totalPages);
      } else if (currentPage > totalPages - 3) {
        buttons.push('...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        buttons.push('...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
      }
    }
    
    return buttons;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="col-span-1 md:col-span-2 lg:col-span-3 p-6 md:p-8 bg-neutral-300 dark:bg-neutral-800 text-neutral-900 dark:text-white transition duration-200 rounded-xl shadow-lg hover:shadow-xl"
    >
      <div className="flex items-center justify-between mb-6 border-b pb-3 border-neutral-400 dark:border-neutral-700">
        <h2 className="text-2xl md:text-3xl font-bold flex items-center">
          <FaUserShield className="mr-3 text-blue-500" />
          User Management
        </h2>
        
        <div className="text-sm text-neutral-600 dark:text-neutral-400">
          <span>{filteredUsers.length} users</span>
        </div>
      </div>
      
      {/* Search and Filter Controls */}
      <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Search Box */}
        <div className="relative">
          <input
            type="text"
            placeholder="Search users..."
            value={search}
            onChange={handleSearchChange}
            className="w-full px-4 py-3 pl-10 bg-neutral-200 dark:bg-neutral-700 border border-neutral-400 dark:border-neutral-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-500" />
        </div>
        
        {/* Role Dropdown */}
        <div className="relative">
          <select
            value={filter}
            onChange={handleFilterChange}
            className="w-full px-4 py-3 pl-10 bg-neutral-200 dark:bg-neutral-700 border border-neutral-400 dark:border-neutral-600 rounded-lg appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Roles</option>
            {[...AVAILABLE_ROLES].sort().map(role => (
              <option key={role} value={role}>{role.charAt(0).toUpperCase() + role.slice(1)}</option>
            ))}
          </select>
          <FaFilter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-500" />
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
            <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
              <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
            </svg>
          </div>
        </div>
      </div>
      
      {/* Role Filter Chips */}
      <div className="mb-6 flex flex-wrap gap-2">
        {allRoles.map(role => (
          <button
            key={role}
            onClick={() => toggleRoleFilter(role)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium flex items-center gap-1.5 transition-all duration-200 ${
              roleFilter.includes(role)
                ? `${getRoleColor(role)} text-white`
                : 'bg-neutral-200 dark:bg-neutral-700 hover:bg-neutral-300 dark:hover:bg-neutral-600'
            }`}
          >
            {roleFilter.includes(role) && <FaCheck className="text-xs" />}
            {role.charAt(0).toUpperCase() + role.slice(1)}
          </button>
        ))}
        {roleFilter.length > 0 && (
          <button
            onClick={() => setRoleFilter([])}
            className="px-3 py-1.5 rounded-full text-sm font-medium bg-neutral-200 dark:bg-neutral-700 hover:bg-neutral-300 dark:hover:bg-neutral-600 flex items-center gap-1.5"
          >
            <FaTimes className="text-xs" />
            Clear filters
          </button>
        )}
      </div>
      
      {/* Show loading state */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        </div>
      ) : error ? (
        <div className="bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-200 p-4 rounded-lg flex items-center justify-center">
          <FaExclamationTriangle className="mr-2" /> {error.message || 'Failed to load users'}
        </div>
      ) : (
        <>
          {/* User Grid */}
          {currentUsers.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center p-8 bg-neutral-200 dark:bg-neutral-700 rounded-lg"
            >
              <FaExclamationTriangle className="text-4xl text-yellow-500 mb-3" />
              <h3 className="text-xl font-bold mb-2">No Users Found</h3>
              <p className="text-neutral-600 dark:text-neutral-400 text-center">
                No users match your current filters. Try adjusting your search criteria.
              </p>
            </motion.div>
          ) : (
            <motion.div 
              layout
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
            >
              {currentUsers.map((user, index) => {
                const profileImage = user.profilePicture || generateAvatar(user.username) || undefined;
                
                return (
                  <motion.div
                    key={user._id}
                    layout="position"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ 
                      duration: 0.3, 
                      delay: index * 0.05,
                      layout: { type: "spring", stiffness: 200, damping: 25 }
                    }}
                  >
                    <div className="relative bg-neutral-200 dark:bg-neutral-700 rounded-lg shadow-md overflow-hidden h-full">
                      {/* User card with background image */}
                      <div className="relative h-full">
                        {/* Profile Image Background */}
                        <div
                          className="absolute inset-0 bg-cover bg-center opacity-10"
                          style={{
                            backgroundImage: `url(${profileImage})`,
                          }}
                        />
                        
                        {/* Content */}
                        <div className="relative p-5 flex flex-col min-h-[180px]">
                          <div className="flex items-start justify-between mb-4">
                            {/* User avatar and name */}
                            <div className="flex items-center">
                              <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-neutral-300 dark:border-neutral-600 mr-3">
                                <img 
                                  src={profileImage} 
                                  alt={user.username}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <h3 className="font-bold text-lg">{user.username}</h3>                                  {user.profile?.trophies && user.profile.trophies.length > 0 && (
                                    <TrophyIndicator trophies={user.profile.trophies} size="small" />
                                  )}
                                </div>
                                <div className="flex items-center">
                                  <FaDiscord 
                                    className="mr-1.5"
                                    style={{ color: user.discordId ? '#7289da' : 'rgba(114, 137, 218, 0.3)' }}
                                  />
                                  <span className="text-sm text-neutral-600 dark:text-neutral-400">
                                    {user.discordUsername || 'Not connected'}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Action buttons */}
                            <div className="flex flex-col gap-2">
                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => toggleEditUser(user)}
                                className="p-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md flex items-center justify-center"
                                disabled={isLoading}
                              >
                                <FaEdit size={16} />
                              </motion.button>
                              <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => handleDisableClick(user._id)}
                                className="p-2 bg-red-500 hover:bg-red-600 text-white rounded-md flex items-center justify-center"
                                disabled={isLoading}
                              >
                                <FaBan size={16} />
                              </motion.button>
                            </div>
                          </div>
                          
                          {/* Email section - make it always take up space */}
                          <div className="text-sm text-neutral-600 dark:text-neutral-400 mb-4 min-h-[1.5rem]">
                            {user.email || ''}
                          </div>
                          
                          {/* Roles - push to bottom with flex */}
                          <div className="flex flex-wrap gap-2 mt-auto">
                            {user.roles && user.roles.sort().map(role => (
                              <span 
                                key={role} 
                                className={`px-2 py-0.5 rounded-md text-xs font-medium text-white ${getRoleColor(role)}`}
                              >
                                {role}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-8 flex flex-wrap justify-center items-center gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-md bg-neutral-200 dark:bg-neutral-700 disabled:opacity-50 hover:bg-neutral-300 dark:hover:bg-neutral-600 transition-colors"
                aria-label="Previous page"
              >
                <FaChevronLeft />
              </button>
              
              {getPaginationButtons().map((btn, i) => (
                btn === '...' ? (
                  <span key={`ellipsis-${i}`} className="px-2">...</span>
                ) : (
                  <button
                    key={`page-${btn}`}
                    onClick={() => setCurrentPage(Number(btn))}
                    className={`w-8 h-8 flex items-center justify-center rounded-md transition-colors ${
                      currentPage === btn
                        ? 'bg-blue-600 text-white'
                        : 'bg-neutral-200 dark:bg-neutral-700 hover:bg-neutral-300 dark:hover:bg-neutral-600'
                    }`}
                  >
                    {btn}
                  </button>
                )
              ))}
              
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="p-2 rounded-md bg-neutral-200 dark:bg-neutral-700 disabled:opacity-50 hover:bg-neutral-300 dark:hover:bg-neutral-600 transition-colors"
                aria-label="Next page"
              >
                <FaChevronRight />
              </button>
            </div>
          )}
        </>
      )}
      
      {/* User Edit Modal */}
      <AnimatePresence>
        {editUser && (
          <UserEditForm
            editUser={editUser}
            handleEditChange={handleEditChange}
            handleEditSubmit={handleEditSubmit}
            setEditUser={setEditUser}
            isLoading={isLoading}
            AVAILABLE_ROLES={AVAILABLE_ROLES}
          />
        )}
      </AnimatePresence>

      {/* Disable User Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={showDisableConfirm}
        title="Disable User"
        message="Are you sure you want to disable this user? They will no longer be able to access the platform."
        confirmText="Disable"
        confirmVariant="danger"
        onConfirm={handleConfirmDisable}
        onCancel={handleCancelDisable}
      />
    </motion.div>
  );
};

export default UserList;
