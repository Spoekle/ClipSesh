import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FaDiscord,
  FaSearch,
  FaEdit,
  FaBan,
  FaChevronLeft,
  FaChevronRight,
  FaCheck,
  FaTimes,
  FaUserShield,
  FaExclamationTriangle,
  FaUserPlus,
  FaTrashAlt,
  FaEnvelope,
  FaUser,
  FaCopy,
  FaEye,
  FaEyeSlash,
  FaLock
} from 'react-icons/fa';
import { useNotification } from '../../../context/AlertContext';
import generateAvatar from '../../../utils/generateAvatar';
import { User, CreateUserFormData, FormErrors } from '../../../types/adminTypes';
import ConfirmationDialog from '../../../components/common/ConfirmationDialog';
import {
  useAllUsers,
  useDisableUser,
  useUpdateUser,
  useApproveUser,
  useDeleteUser,
  useCreateUser
} from '../../../hooks/useAdmin';

interface UserListProps {
  fetchUsers?: () => void;
  disabledUsers?: User[];
  setDisabledUsers?: React.Dispatch<React.SetStateAction<User[]>>;
  AVAILABLE_ROLES: string[];
}

const getRoleBadgeClasses = (role: string, isSelected: boolean = true): string => {
  switch (role.toLowerCase()) {
    case 'admin':
      return isSelected
        ? 'bg-[#f23030]/20 text-[#f23030] border border-[#f23030]/40'
        : 'bg-[#141414] text-[#aaaaaa] border border-[#262626] hover:border-[#383838]';
    case 'clipteam':
      return isSelected
        ? 'bg-[#38bdf8]/20 text-[#38bdf8] border border-[#38bdf8]/40'
        : 'bg-[#141414] text-[#aaaaaa] border border-[#262626] hover:border-[#383838]';
    case 'editor':
      return isSelected
        ? 'bg-[#22c55e]/20 text-[#22c55e] border border-[#22c55e]/40'
        : 'bg-[#141414] text-[#aaaaaa] border border-[#262626] hover:border-[#383838]';
    case 'uploader':
      return isSelected
        ? 'bg-[#f97316]/20 text-[#f97316] border border-[#f97316]/40'
        : 'bg-[#141414] text-[#aaaaaa] border border-[#262626] hover:border-[#383838]';
    default:
      return isSelected
        ? 'bg-[#222222] text-[#f1f1f1] border border-[#383838]'
        : 'bg-[#141414] text-[#717171] border border-[#262626] hover:border-[#383838]';
  }
};

const UserList: React.FC<UserListProps> = ({ AVAILABLE_ROLES }) => {
  const { showSuccess, showError } = useNotification();

  // Queries and mutations
  const { data: allUsers = [], isLoading: loading, error } = useAllUsers();
  const updateUserMutation = useUpdateUser();
  const disableUserMutation = useDisableUser();
  const approveUserMutation = useApproveUser();
  const deleteUserMutation = useDeleteUser();
  const createUserMutation = useCreateUser();

  // Filter & search states
  const [search, setSearch] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'disabled'>('all');
  const [roleFilter, setRoleFilter] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const usersPerPage = 8;

  // Selection & Right Panel Mode
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [isCreateMode, setIsCreateMode] = useState<boolean>(false);

  // Edit form state
  const [editFormData, setEditFormData] = useState<{
    username: string;
    email: string;
    password: string;
    roles: string[];
  }>({
    username: '',
    email: '',
    password: '',
    roles: ['user']
  });
  const [showEditPassword, setShowEditPassword] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [copiedId, setCopiedId] = useState<boolean>(false);

  // Create form state
  const [createFormData, setCreateFormData] = useState<CreateUserFormData>({
    username: '',
    password: '',
    email: '',
    roles: ['user']
  });
  const [createErrors, setCreateErrors] = useState<FormErrors>({});
  const [showCreatePassword, setShowCreatePassword] = useState<boolean>(false);
  const [isCreating, setIsCreating] = useState<boolean>(false);

  // Confirmation dialogs
  const [dialogState, setDialogState] = useState<{
    isOpen: boolean;
    type: 'disable' | 'delete' | null;
    targetUser: User | null;
  }>({
    isOpen: false,
    type: null,
    targetUser: null
  });

  // Derived selected user from allUsers
  const selectedUser = useMemo(() => {
    if (!selectedUserId) return null;
    return allUsers.find((u: User) => u._id === selectedUserId) || null;
  }, [allUsers, selectedUserId]);

  // Sync edit form when selected user changes
  useEffect(() => {
    if (selectedUser) {
      setEditFormData({
        username: selectedUser.username || '',
        email: selectedUser.email || '',
        password: '',
        roles: selectedUser.roles && selectedUser.roles.length > 0 ? [...selectedUser.roles] : ['user']
      });
      setShowEditPassword(false);
    }
  }, [selectedUser]);

  // All distinct roles across all users
  const allRoles = useMemo(() => {
    const rolesSet = new Set<string>(AVAILABLE_ROLES);
    allUsers.forEach((u: User) => {
      if (u.roles) u.roles.forEach(r => rolesSet.add(r));
    });
    return Array.from(rolesSet).sort();
  }, [AVAILABLE_ROLES, allUsers]);

  // Filtered users list
  const filteredUsers = useMemo(() => {
    return allUsers.filter((user: User) => {
      // Status filter
      const isUserDisabled = user.status === 'disabled';
      if (statusFilter === 'active' && isUserDisabled) return false;
      if (statusFilter === 'disabled' && !isUserDisabled) return false;

      // Role filter
      if (roleFilter.length > 0) {
        const hasRole = user.roles && user.roles.some(r => roleFilter.includes(r));
        if (!hasRole) return false;
      }

      // Search query
      if (search.trim()) {
        const query = search.toLowerCase();
        const matchUsername = user.username?.toLowerCase().includes(query);
        const matchEmail = user.email?.toLowerCase().includes(query);
        const matchDiscord = user.discordUsername?.toLowerCase().includes(query);
        if (!matchUsername && !matchEmail && !matchDiscord) return false;
      }

      return true;
    });
  }, [allUsers, statusFilter, roleFilter, search]);

  const sortedUsers = useMemo(() => {
    return [...filteredUsers].sort((a, b) => a.username.localeCompare(b.username));
  }, [filteredUsers]);

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(sortedUsers.length / usersPerPage));
  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = sortedUsers.slice(indexOfFirstUser, indexOfLastUser);

  // Clamping page
  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  // Handlers
  const handleSelectUser = (user: User) => {
    setIsCreateMode(false);
    setSelectedUserId(user._id);
  };

  const handleStartCreate = () => {
    setSelectedUserId(null);
    setIsCreateMode(true);
    setCreateFormData({
      username: '',
      password: '',
      email: '',
      roles: ['user']
    });
    setCreateErrors({});
  };

  const handleCloseRightPanel = () => {
    setSelectedUserId(null);
    setIsCreateMode(false);
  };

  const toggleRoleFilter = (role: string) => {
    setRoleFilter(prev =>
      prev.includes(role) ? prev.filter(r => r !== role) : [...prev, role]
    );
    setCurrentPage(1);
  };

  const handleEditRoleToggle = (role: string) => {
    setEditFormData(prev => {
      const currentRoles = prev.roles;
      if (currentRoles.includes(role)) {
        if (currentRoles.length === 1) {
          showError('User must have at least one role');
          return prev;
        }
        return { ...prev, roles: currentRoles.filter(r => r !== role) };
      } else {
        return { ...prev, roles: [...currentRoles, role] };
      }
    });
  };

  const handleCreateRoleToggle = (role: string) => {
    setCreateFormData(prev => {
      const currentRoles = prev.roles;
      if (currentRoles.includes(role)) {
        if (currentRoles.length === 1) {
          showError('User must have at least one role');
          return prev;
        }
        return { ...prev, roles: currentRoles.filter(r => r !== role) };
      } else {
        return { ...prev, roles: [...currentRoles, role] };
      }
    });
  };

  const openDisableModal = (user: User) => {
    setDialogState({
      isOpen: true,
      type: 'disable',
      targetUser: user
    });
  };

  const openDeleteModal = (user: User) => {
    setDialogState({
      isOpen: true,
      type: 'delete',
      targetUser: user
    });
  };

  const handleConfirmDialog = async () => {
    const { type, targetUser } = dialogState;
    if (!type || !targetUser) return;

    try {
      if (type === 'disable') {
        await disableUserMutation.mutateAsync(targetUser._id);
        showSuccess(`User "${targetUser.username}" disabled`);
      } else if (type === 'delete') {
        await deleteUserMutation.mutateAsync(targetUser._id);
        showSuccess(`User "${targetUser.username}" deleted`);
        if (selectedUserId === targetUser._id) {
          setSelectedUserId(null);
        }
      }
    } catch (err: any) {
      console.error(`Failed to ${type} user:`, err);
      showError(err.response?.data?.message || err.message || `Failed to ${type} user`);
    } finally {
      setDialogState({ isOpen: false, type: null, targetUser: null });
    }
  };

  const handleEnableUser = async (user: User) => {
    try {
      await approveUserMutation.mutateAsync(user._id);
      showSuccess(`User "${user.username}" enabled`);
    } catch (err: any) {
      console.error('Failed to enable user:', err);
      showError(err.response?.data?.message || err.message || 'Failed to enable user');
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    if (!editFormData.username.trim()) {
      showError('Username is required');
      return;
    }

    if (editFormData.roles.length === 0) {
      showError('Please assign at least one role');
      return;
    }

    setIsSaving(true);
    try {
      const payload: any = {
        username: editFormData.username.trim(),
        roles: editFormData.roles
      };

      if (editFormData.email.trim()) {
        payload.email = editFormData.email.trim();
      }

      if (editFormData.password.trim()) {
        if (editFormData.password.length < 6) {
          showError('Password must be at least 6 characters');
          setIsSaving(false);
          return;
        }
        payload.password = editFormData.password;
      }

      await updateUserMutation.mutateAsync({
        userId: selectedUser._id,
        updateData: payload
      });

      showSuccess(`User "${editFormData.username}" updated successfully`);
      setEditFormData(prev => ({ ...prev, password: '' }));
      setShowEditPassword(false);
    } catch (err: any) {
      console.error('Failed to update user:', err);
      showError(err.response?.data?.message || err.message || 'Failed to update user');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const errors: FormErrors = {};
    if (!createFormData.username.trim()) {
      errors.username = 'Username is required';
    }
    if (!createFormData.password) {
      errors.password = 'Password is required';
    } else if (createFormData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }
    if (createFormData.roles.length === 0) {
      errors.roles = 'Please select at least one role';
    }

    if (Object.keys(errors).length > 0) {
      setCreateErrors(errors);
      return;
    }

    setIsCreating(true);
    try {
      await createUserMutation.mutateAsync({
        username: createFormData.username.trim(),
        password: createFormData.password,
        email: createFormData.email?.trim() || '',
        roles: createFormData.roles,
        status: 'active'
      });

      showSuccess(`User "${createFormData.username}" created successfully`);
      setIsCreateMode(false);
      setCreateFormData({
        username: '',
        password: '',
        email: '',
        roles: ['user']
      });
    } catch (err: any) {
      console.error('Failed to create user:', err);
      showError(err.response?.data?.message || err.message || 'Failed to create user');
    } finally {
      setIsCreating(false);
    }
  };

  const copyUserId = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const activeCount = useMemo(() => allUsers.filter(u => u.status !== 'disabled').length, [allUsers]);
  const disabledCount = useMemo(() => allUsers.filter(u => u.status === 'disabled').length, [allUsers]);

  return (
    <div className="w-full">
      {/* Top Header Card */}
      <div className="bg-[#181818] border border-[#262626] p-5 sm:p-6 rounded-2xl mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-[#f23030]/15 text-[#f23030] flex items-center justify-center">
            <FaUserShield className="text-xl" />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-[#f1f1f1] tracking-tight flex items-center gap-2">
              User Management
            </h1>
            <p className="text-xs sm:text-sm text-[#aaaaaa]">
              Manage user accounts, roles, access permissions, and credentials
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            onClick={handleStartCreate}
            className={`w-full sm:w-auto px-4 py-2 rounded-xl font-medium text-xs flex items-center justify-center gap-2 transition-all cursor-pointer ${
              isCreateMode
                ? 'bg-[#22c55e] text-white shadow-sm'
                : 'bg-[#f23030] hover:bg-[#d92222] text-white shadow-sm'
            }`}
          >
            <FaUserPlus />
            <span>New User</span>
          </button>
        </div>
      </div>

      {/* Main Split Layout: Left (Master List) | Right (Editor Panel) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: User Directory & Filters (7 Columns) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Controls Bar: Search & Status Tabs */}
          <div className="bg-[#181818] border border-[#262626] p-4 rounded-xl space-y-3">
            {/* Search input */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search by username, email, or Discord tag..."
                value={search}
                onChange={e => {
                  setSearch(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-10 pr-10 py-2 bg-[#121212] border border-[#262626] rounded-xl text-xs text-[#f1f1f1] placeholder-[#717171] focus:outline-none focus:border-[#444] transition-colors"
              />
              <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#717171] text-xs" />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#717171] hover:text-[#f1f1f1]"
                >
                  <FaTimes className="text-xs" />
                </button>
              )}
            </div>

            {/* Status Filter Tabs & Role Chips */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-2 border-t border-[#262626]">
              {/* Status pills */}
              <div className="flex items-center gap-1.5 p-1 bg-[#121212] rounded-xl border border-[#262626]">
                <button
                  onClick={() => {
                    setStatusFilter('all');
                    setCurrentPage(1);
                  }}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                    statusFilter === 'all'
                      ? 'bg-[#222222] text-[#f1f1f1] shadow-xs'
                      : 'text-[#aaaaaa] hover:text-[#f1f1f1]'
                  }`}
                >
                  All ({allUsers.length})
                </button>
                <button
                  onClick={() => {
                    setStatusFilter('active');
                    setCurrentPage(1);
                  }}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                    statusFilter === 'active'
                      ? 'bg-[#22c55e]/20 text-[#22c55e] shadow-xs'
                      : 'text-[#aaaaaa] hover:text-[#f1f1f1]'
                  }`}
                >
                  Active ({activeCount})
                </button>
                <button
                  onClick={() => {
                    setStatusFilter('disabled');
                    setCurrentPage(1);
                  }}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                    statusFilter === 'disabled'
                      ? 'bg-[#f23030]/20 text-[#f23030] shadow-xs'
                      : 'text-[#aaaaaa] hover:text-[#f1f1f1]'
                  }`}
                >
                  Disabled ({disabledCount})
                </button>
              </div>

              {/* Match Counter */}
              <span className="text-xs text-[#717171]">
                Showing {filteredUsers.length} users
              </span>
            </div>

            {/* Role Filter Chips */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              <span className="text-xs text-[#717171] mr-1 font-medium">Role:</span>
              {allRoles.map(role => {
                const isActive = roleFilter.includes(role);
                return (
                  <button
                    key={role}
                    onClick={() => toggleRoleFilter(role)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium capitalize transition-all cursor-pointer flex items-center gap-1.5 ${getRoleBadgeClasses(
                      role,
                      isActive
                    )}`}
                  >
                    {isActive && <FaCheck className="text-[10px]" />}
                    {role}
                  </button>
                );
              })}
              {roleFilter.length > 0 && (
                <button
                  onClick={() => setRoleFilter([])}
                  className="px-2 py-1 rounded-lg text-xs text-[#717171] hover:text-[#f1f1f1] bg-[#121212] border border-[#262626] transition-colors cursor-pointer"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* User List Rows */}
          <div className="space-y-2">
            {loading ? (
              <div className="bg-[#181818] border border-[#262626] p-12 rounded-xl flex flex-col items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#f23030] border-t-transparent mb-3" />
                <p className="text-xs text-[#aaaaaa]">Loading users...</p>
              </div>
            ) : error ? (
              <div className="bg-[#181818] border border-[#f23030]/40 p-6 rounded-xl text-[#f23030] flex items-center gap-3">
                <FaExclamationTriangle className="text-lg flex-shrink-0" />
                <span className="text-xs">{error.message || 'Failed to load users'}</span>
              </div>
            ) : currentUsers.length === 0 ? (
              <div className="bg-[#181818] border border-[#262626] p-10 rounded-xl text-center">
                <FaExclamationTriangle className="text-2xl text-[#eab308] mx-auto mb-3" />
                <h3 className="text-sm font-semibold text-[#f1f1f1] mb-1">No Users Found</h3>
                <p className="text-xs text-[#aaaaaa] max-w-sm mx-auto mb-4">
                  No users matched your current search and role filters.
                </p>
                <button
                  onClick={() => {
                    setSearch('');
                    setStatusFilter('all');
                    setRoleFilter([]);
                  }}
                  className="px-3.5 py-1.5 bg-[#222222] hover:bg-[#2a2a2a] text-xs font-medium text-[#f1f1f1] rounded-lg transition-colors cursor-pointer"
                >
                  Reset Filters
                </button>
              </div>
            ) : (
              currentUsers.map(user => {
                const isSelected = selectedUserId === user._id && !isCreateMode;
                const isDisabled = user.status === 'disabled';
                const avatarUrl = user.profilePicture || generateAvatar(user.username) || undefined;

                return (
                  <motion.div
                    key={user._id}
                    layout="position"
                    onClick={() => handleSelectUser(user)}
                    className={`relative p-3.5 rounded-xl border transition-all cursor-pointer select-none ${
                      isSelected
                        ? 'bg-[#1e1e1e] border-[#f23030] ring-1 ring-[#f23030]/40 shadow-sm'
                        : 'bg-[#141414] hover:bg-[#181818] border-[#262626] hover:border-[#383838]'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      {/* Left: Avatar & Identity */}
                      <div className="flex items-center gap-3 min-w-0">
                        {/* Avatar with status dot */}
                        <div className="relative flex-shrink-0">
                          <div className="w-10 h-10 rounded-full overflow-hidden border border-[#262626] bg-[#121212]">
                            <img
                              src={avatarUrl}
                              alt={user.username}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          {/* Online / Status Dot */}
                          <span
                            className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-[#141414] ${
                              isDisabled ? 'bg-[#f23030]' : 'bg-[#22c55e]'
                            }`}
                            title={isDisabled ? 'Disabled' : 'Active'}
                          />
                        </div>

                        {/* Text info */}
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="text-xs sm:text-sm font-bold text-[#f1f1f1] truncate">
                              {user.username}
                            </h3>
                            {isDisabled && (
                              <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-[#f23030]/15 text-[#f23030] border border-[#f23030]/30 uppercase tracking-wide">
                                Disabled
                              </span>
                            )}
                          </div>

                          {/* Discord & Email subline */}
                          <div className="flex items-center gap-3 text-xs text-[#717171] mt-0.5">
                            <span className="flex items-center gap-1 truncate">
                              <FaDiscord
                                className="text-xs flex-shrink-0"
                                style={{ color: user.discordId ? '#5865F2' : '#6b7280' }}
                              />
                              <span className="truncate">
                                {user.discordUsername || 'No Discord'}
                              </span>
                            </span>
                            {user.email && (
                              <span className="hidden sm:inline-block text-[#717171] truncate max-w-[140px]">
                                {user.email}
                              </span>
                            )}
                          </div>

                          {/* Role Badges */}
                          <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                            {user.roles && user.roles.map(role => (
                              <span
                                key={role}
                                className={`px-2 py-0.5 rounded text-[10px] font-medium capitalize ${getRoleBadgeClasses(
                                  role,
                                  true
                                )}`}
                              >
                                {role}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Right: Quick Actions */}
                      <div
                        className="flex items-center gap-1.5 flex-shrink-0"
                        onClick={e => e.stopPropagation()}
                      >
                        {/* Edit Button */}
                        <button
                          onClick={() => handleSelectUser(user)}
                          title="Edit User"
                          className={`p-2 rounded-lg text-xs transition-colors cursor-pointer ${
                            isSelected
                              ? 'bg-[#f23030] text-white'
                              : 'bg-[#181818] hover:bg-[#222222] text-[#aaaaaa] hover:text-[#f1f1f1] border border-[#262626]'
                          }`}
                        >
                          <FaEdit />
                        </button>

                        {/* Enable / Disable Quick Toggle */}
                        {isDisabled ? (
                          <button
                            onClick={() => handleEnableUser(user)}
                            title="Enable User"
                            className="p-2 rounded-lg text-xs bg-[#22c55e]/15 hover:bg-[#22c55e]/25 text-[#22c55e] border border-[#22c55e]/30 transition-colors cursor-pointer"
                          >
                            <FaCheck />
                          </button>
                        ) : (
                          <button
                            onClick={() => openDisableModal(user)}
                            title="Disable User"
                            className="p-2 rounded-lg text-xs bg-[#eab308]/15 hover:bg-[#eab308]/25 text-[#eab308] border border-[#eab308]/30 transition-colors cursor-pointer"
                          >
                            <FaBan />
                          </button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="bg-[#181818] border border-[#262626] p-3 rounded-xl flex items-center justify-between text-xs text-[#717171]">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 bg-[#121212] hover:bg-[#222222] disabled:opacity-30 border border-[#262626] rounded-lg transition-colors flex items-center gap-1.5 text-[#aaaaaa] cursor-pointer disabled:cursor-not-allowed"
              >
                <FaChevronLeft className="text-[10px]" />
                <span>Prev</span>
              </button>

              <span className="text-[#aaaaaa]">
                Page {currentPage} of {totalPages}
              </span>

              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 bg-[#121212] hover:bg-[#222222] disabled:opacity-30 border border-[#262626] rounded-lg transition-colors flex items-center gap-1.5 text-[#aaaaaa] cursor-pointer disabled:cursor-not-allowed"
              >
                <span>Next</span>
                <FaChevronRight className="text-[10px]" />
              </button>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Dedicated Editor & Creator Panel (5 Columns, Sticky) */}
        <div className="lg:col-span-5 lg:sticky lg:top-6">
          <AnimatePresence mode="wait">
            {/* 1. EDIT MODE: User is Selected */}
            {selectedUser && !isCreateMode ? (
              <motion.div
                key={`edit-${selectedUser._id}`}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.2 }}
                className="bg-[#181818] border border-[#262626] p-5 sm:p-6 rounded-2xl shadow-sm"
              >
                {/* Editor Header */}
                <div className="flex items-start justify-between gap-3 pb-4 border-b border-[#262626]">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full overflow-hidden border border-[#262626] bg-[#121212] flex-shrink-0">
                      <img
                        src={selectedUser.profilePicture || generateAvatar(selectedUser.username) || undefined}
                        alt={selectedUser.username}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-base sm:text-lg font-bold text-[#f1f1f1] leading-tight">
                          {selectedUser.username}
                        </h2>
                        <span
                          className={`w-2.5 h-2.5 rounded-full ${
                            selectedUser.status === 'disabled' ? 'bg-[#f23030]' : 'bg-[#22c55e]'
                          }`}
                          title={selectedUser.status === 'disabled' ? 'Disabled' : 'Active'}
                        />
                      </div>
                      <p className="text-xs text-[#717171] mt-0.5">Edit User Account & Roles</p>
                    </div>
                  </div>

                  <button
                    onClick={handleCloseRightPanel}
                    className="p-1.5 rounded-lg text-[#717171] hover:text-[#f1f1f1] hover:bg-[#222222] transition-colors cursor-pointer"
                    title="Close Editor"
                  >
                    <FaTimes size={14} />
                  </button>
                </div>

                {/* ID & Discord Info Strip */}
                <div className="flex items-center justify-between gap-2 py-2.5 px-3.5 my-4 bg-[#121212] rounded-xl border border-[#262626] text-xs">
                  <div className="flex items-center gap-1.5 text-[#717171] truncate">
                    <span className="font-mono text-[#717171]">ID:</span>
                    <span className="font-mono text-[#aaaaaa] truncate max-w-[120px]">
                      {selectedUser._id}
                    </span>
                    <button
                      onClick={() => copyUserId(selectedUser._id)}
                      className="text-[#717171] hover:text-[#f1f1f1] ml-1 cursor-pointer"
                      title="Copy ID"
                    >
                      <FaCopy size={11} />
                    </button>
                    {copiedId && <span className="text-[#22c55e] text-[10px]">Copied!</span>}
                  </div>

                  <div className="flex items-center gap-1.5 text-[#aaaaaa]">
                    <FaDiscord
                      style={{ color: selectedUser.discordId ? '#5865F2' : '#717171' }}
                    />
                    <span className="truncate max-w-[110px]">
                      {selectedUser.discordUsername || 'No Discord'}
                    </span>
                  </div>
                </div>

                {/* Edit Form */}
                <form onSubmit={handleSaveEdit} className="space-y-4">
                  {/* Username Field */}
                  <div>
                    <label className="block text-xs font-semibold text-[#aaaaaa] uppercase tracking-wider mb-1.5">
                      Username <span className="text-[#f23030]">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={editFormData.username}
                        onChange={e =>
                          setEditFormData(prev => ({ ...prev, username: e.target.value }))
                        }
                        required
                        className="w-full pl-9 pr-3.5 py-2 bg-[#121212] border border-[#262626] rounded-xl text-xs text-[#f1f1f1] focus:outline-none focus:border-[#444]"
                      />
                      <FaUser className="absolute left-3 top-1/2 -translate-y-1/2 text-[#717171] text-xs" />
                    </div>
                  </div>

                  {/* Email Field */}
                  <div>
                    <label className="block text-xs font-semibold text-[#aaaaaa] uppercase tracking-wider mb-1.5">
                      Email Address
                    </label>
                    <div className="relative">
                      <input
                        type="email"
                        value={editFormData.email}
                        onChange={e =>
                          setEditFormData(prev => ({ ...prev, email: e.target.value }))
                        }
                        placeholder="user@example.com"
                        className="w-full pl-9 pr-3.5 py-2 bg-[#121212] border border-[#262626] rounded-xl text-xs text-[#f1f1f1] placeholder-[#717171] focus:outline-none focus:border-[#444]"
                      />
                      <FaEnvelope className="absolute left-3 top-1/2 -translate-y-1/2 text-[#717171] text-xs" />
                    </div>
                  </div>

                  {/* Password Reset Field */}
                  <div>
                    <label className="block text-xs font-semibold text-[#aaaaaa] uppercase tracking-wider mb-1.5">
                      Reset Password{' '}
                      <span className="text-[10px] text-[#717171] normal-case">
                        (leave blank to keep unchanged)
                      </span>
                    </label>
                    <div className="relative">
                      <input
                        type={showEditPassword ? 'text' : 'password'}
                        value={editFormData.password}
                        onChange={e =>
                          setEditFormData(prev => ({ ...prev, password: e.target.value }))
                        }
                        placeholder="Enter new password..."
                        className="w-full pl-9 pr-10 py-2 bg-[#121212] border border-[#262626] rounded-xl text-xs text-[#f1f1f1] placeholder-[#717171] focus:outline-none focus:border-[#444]"
                      />
                      <FaLock className="absolute left-3 top-1/2 -translate-y-1/2 text-[#717171] text-xs" />
                      <button
                        type="button"
                        onClick={() => setShowEditPassword(prev => !prev)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#717171] hover:text-[#f1f1f1] cursor-pointer"
                      >
                        {showEditPassword ? <FaEyeSlash size={13} /> : <FaEye size={13} />}
                      </button>
                    </div>
                  </div>

                  {/* Roles Multi-Select */}
                  <div>
                    <label className="block text-xs font-semibold text-[#aaaaaa] uppercase tracking-wider mb-2">
                      Assigned Roles <span className="text-[#f23030]">*</span>
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {allRoles.map(role => {
                        const isAssigned = editFormData.roles.includes(role);
                        return (
                          <button
                            type="button"
                            key={role}
                            onClick={() => handleEditRoleToggle(role)}
                            className={`p-2 rounded-xl text-xs font-medium capitalize flex items-center justify-between border transition-all cursor-pointer ${
                              isAssigned
                                ? getRoleBadgeClasses(role, true)
                                : 'bg-[#121212] text-[#717171] border-[#262626] hover:border-[#383838]'
                            }`}
                          >
                            <span>{role}</span>
                            {isAssigned && <FaCheck className="text-[10px]" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Account Status & Actions */}
                  <div className="pt-3 border-t border-[#262626]">
                    <span className="block text-xs font-semibold text-[#717171] uppercase tracking-wider mb-2">
                      Account Status & Actions
                    </span>
                    <div className="grid grid-cols-2 gap-2">
                      {selectedUser.status === 'disabled' ? (
                        <button
                          type="button"
                          onClick={() => handleEnableUser(selectedUser)}
                          className="px-3 py-2 rounded-xl text-xs font-medium bg-[#22c55e]/15 hover:bg-[#22c55e]/25 text-[#22c55e] border border-[#22c55e]/30 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <FaCheck />
                          <span>Enable User</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => openDisableModal(selectedUser)}
                          className="px-3 py-2 rounded-xl text-xs font-medium bg-[#eab308]/15 hover:bg-[#eab308]/25 text-[#eab308] border border-[#eab308]/30 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                        >
                          <FaBan />
                          <span>Disable User</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => openDeleteModal(selectedUser)}
                        className="px-3 py-2 rounded-xl text-xs font-medium bg-[#f23030]/15 hover:bg-[#f23030]/25 text-[#f23030] border border-[#f23030]/30 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <FaTrashAlt />
                        <span>Delete User</span>
                      </button>
                    </div>
                  </div>

                  {/* Save & Cancel Buttons */}
                  <div className="flex items-center justify-end gap-2 pt-4 border-t border-[#262626]">
                    <button
                      type="button"
                      onClick={handleCloseRightPanel}
                      className="px-4 py-2 rounded-xl text-xs font-medium text-[#aaaaaa] hover:text-[#f1f1f1] bg-[#141414] hover:bg-[#222222] border border-[#262626] transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSaving}
                      className="px-5 py-2 rounded-xl text-xs font-semibold text-white bg-[#f23030] hover:bg-[#d92222] disabled:opacity-50 transition-all flex items-center gap-2 shadow-sm cursor-pointer disabled:cursor-not-allowed"
                    >
                      {isSaving ? (
                        <>
                          <div className="animate-spin rounded-full h-3 w-3 border-2 border-white border-t-transparent" />
                          <span>Saving...</span>
                        </>
                      ) : (
                        <>
                          <FaCheck />
                          <span>Save Changes</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </motion.div>
            ) : isCreateMode ? (
              /* 2. CREATE MODE: "+ New User" is clicked */
              <motion.div
                key="create-mode"
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.2 }}
                className="bg-[#181818] border border-[#262626] p-5 sm:p-6 rounded-2xl shadow-sm"
              >
                {/* Header */}
                <div className="flex items-center justify-between gap-3 pb-4 border-b border-[#262626]">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#22c55e]/15 text-[#22c55e] flex items-center justify-center text-base">
                      <FaUserPlus />
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-[#f1f1f1]">Create New User</h2>
                      <p className="text-xs text-[#717171]">Add a new account to ClipSesh</p>
                    </div>
                  </div>

                  <button
                    onClick={handleCloseRightPanel}
                    className="p-1.5 rounded-lg text-[#717171] hover:text-[#f1f1f1] hover:bg-[#222222] transition-colors cursor-pointer"
                  >
                    <FaTimes size={14} />
                  </button>
                </div>

                {/* Create Form */}
                <form onSubmit={handleCreateSubmit} className="space-y-4 mt-4">
                  {/* Username */}
                  <div>
                    <label className="block text-xs font-semibold text-[#aaaaaa] uppercase tracking-wider mb-1">
                      Username <span className="text-[#f23030]">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={createFormData.username}
                        onChange={e =>
                          setCreateFormData(prev => ({ ...prev, username: e.target.value }))
                        }
                        placeholder="e.g. SpeedRunner42"
                        className={`w-full pl-9 pr-3.5 py-2 bg-[#121212] border rounded-xl text-xs text-[#f1f1f1] placeholder-[#717171] focus:outline-none ${
                          createErrors.username
                            ? 'border-[#f23030]'
                            : 'border-[#262626] focus:border-[#444]'
                        }`}
                      />
                      <FaUser className="absolute left-3 top-1/2 -translate-y-1/2 text-[#717171] text-xs" />
                    </div>
                    {createErrors.username && (
                      <p className="text-xs text-[#f23030] mt-1">{createErrors.username}</p>
                    )}
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-xs font-semibold text-[#aaaaaa] uppercase tracking-wider mb-1">
                      Email Address
                    </label>
                    <div className="relative">
                      <input
                        type="email"
                        value={createFormData.email}
                        onChange={e =>
                          setCreateFormData(prev => ({ ...prev, email: e.target.value }))
                        }
                        placeholder="user@example.com"
                        className={`w-full pl-9 pr-3.5 py-2 bg-[#121212] border rounded-xl text-xs text-[#f1f1f1] placeholder-[#717171] focus:outline-none ${
                          createErrors.email
                            ? 'border-[#f23030]'
                            : 'border-[#262626] focus:border-[#444]'
                        }`}
                      />
                      <FaEnvelope className="absolute left-3 top-1/2 -translate-y-1/2 text-[#717171] text-xs" />
                    </div>
                    {createErrors.email && (
                      <p className="text-xs text-[#f23030] mt-1">{createErrors.email}</p>
                    )}
                  </div>

                  {/* Password */}
                  <div>
                    <label className="block text-xs font-semibold text-[#aaaaaa] uppercase tracking-wider mb-1">
                      Password <span className="text-[#f23030]">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showCreatePassword ? 'text' : 'password'}
                        value={createFormData.password}
                        onChange={e =>
                          setCreateFormData(prev => ({ ...prev, password: e.target.value }))
                        }
                        placeholder="Minimum 6 characters"
                        className={`w-full pl-9 pr-10 py-2 bg-[#121212] border rounded-xl text-xs text-[#f1f1f1] placeholder-[#717171] focus:outline-none ${
                          createErrors.password
                            ? 'border-[#f23030]'
                            : 'border-[#262626] focus:border-[#444]'
                        }`}
                      />
                      <FaLock className="absolute left-3 top-1/2 -translate-y-1/2 text-[#717171] text-xs" />
                      <button
                        type="button"
                        onClick={() => setShowCreatePassword(prev => !prev)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#717171] hover:text-[#f1f1f1] cursor-pointer"
                      >
                        {showCreatePassword ? <FaEyeSlash size={13} /> : <FaEye size={13} />}
                      </button>
                    </div>
                    {createErrors.password && (
                      <p className="text-xs text-[#f23030] mt-1">{createErrors.password}</p>
                    )}
                  </div>

                  {/* Roles */}
                  <div>
                    <label className="block text-xs font-semibold text-[#aaaaaa] uppercase tracking-wider mb-2">
                      Assigned Roles <span className="text-[#f23030]">*</span>
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {allRoles.map(role => {
                        const isAssigned = createFormData.roles.includes(role);
                        return (
                          <button
                            type="button"
                            key={role}
                            onClick={() => handleCreateRoleToggle(role)}
                            className={`p-2 rounded-xl text-xs font-medium capitalize flex items-center justify-between border transition-all cursor-pointer ${
                              isAssigned
                                ? getRoleBadgeClasses(role, true)
                                : 'bg-[#121212] text-[#717171] border-[#262626] hover:border-[#383838]'
                            }`}
                          >
                            <span>{role}</span>
                            {isAssigned && <FaCheck className="text-[10px]" />}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Footer actions */}
                  <div className="flex items-center justify-end gap-2 pt-4 border-t border-[#262626]">
                    <button
                      type="button"
                      onClick={handleCloseRightPanel}
                      className="px-4 py-2 rounded-xl text-xs font-medium text-[#aaaaaa] hover:text-[#f1f1f1] bg-[#141414] hover:bg-[#222222] border border-[#262626] transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isCreating}
                      className="px-5 py-2 rounded-xl text-xs font-semibold text-white bg-[#22c55e] hover:bg-[#16a34a] disabled:opacity-50 transition-all flex items-center gap-2 shadow-sm cursor-pointer disabled:cursor-not-allowed"
                    >
                      {isCreating ? (
                        <>
                          <div className="animate-spin rounded-full h-3 w-3 border-2 border-white border-t-transparent" />
                          <span>Creating...</span>
                        </>
                      ) : (
                        <>
                          <FaUserPlus />
                          <span>Create User</span>
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </motion.div>
            ) : (
              /* 3. EMPTY STATE: No selection */
              <motion.div
                key="empty-state"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="bg-[#181818] border border-[#262626] p-8 rounded-2xl text-center"
              >
                <div className="w-14 h-14 rounded-2xl bg-[#141414] border border-[#262626] flex items-center justify-center text-[#717171] mx-auto mb-4 text-xl">
                  <FaUserShield />
                </div>
                <h3 className="text-sm font-bold text-[#f1f1f1] mb-2">User Details & Editor</h3>
                <p className="text-xs text-[#717171] max-w-xs mx-auto mb-6 leading-relaxed">
                  Select a user from the list on the left to edit their permissions, change passwords, or toggle account status.
                </p>
                <button
                  onClick={handleStartCreate}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#141414] hover:bg-[#222222] text-[#f1f1f1] text-xs font-medium border border-[#262626] transition-colors cursor-pointer"
                >
                  <FaUserPlus className="text-[#22c55e]" />
                  <span>Or create a new user</span>
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Confirmation Dialog for Disable / Delete */}
      <ConfirmationDialog
        isOpen={dialogState.isOpen}
        title={dialogState.type === 'delete' ? 'Delete User' : 'Disable User'}
        message={
          dialogState.type === 'delete'
            ? `Are you sure you want to permanently delete "${dialogState.targetUser?.username}"? This action cannot be undone.`
            : `Are you sure you want to disable "${dialogState.targetUser?.username}"? They will no longer be able to log in.`
        }
        confirmText={dialogState.type === 'delete' ? 'Delete' : 'Disable'}
        confirmVariant={dialogState.type === 'delete' ? 'danger' : 'danger'}
        onConfirm={handleConfirmDialog}
        onCancel={() => setDialogState({ isOpen: false, type: null, targetUser: null })}
      />
    </div>
  );
};

export default UserList;
