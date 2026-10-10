'use client';

import { useState, useMemo, useEffect } from 'react';
import { useNotification } from '@/context/AlertContext';
import { User, CreateUserFormData, FormErrors } from '@/types/adminTypes';
import {
  useAllUsers,
  useDisableUser,
  useUpdateUser,
  useApproveUser,
  useDeleteUser,
  useCreateUser,
} from '@/hooks/useAdmin';

export function useUserManagementState(AVAILABLE_ROLES: string[]) {
  const { showSuccess, showError } = useNotification();

  const { data: allUsers = [], isLoading: loading, error } = useAllUsers();
  const updateUserMutation = useUpdateUser();
  const disableUserMutation = useDisableUser();
  const approveUserMutation = useApproveUser();
  const deleteUserMutation = useDeleteUser();
  const createUserMutation = useCreateUser();

  const [search, setSearch] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'disabled'>('all');
  const [roleFilter, setRoleFilter] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const usersPerPage = 8;

  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [isCreateMode, setIsCreateMode] = useState<boolean>(false);

  const [editFormData, setEditFormData] = useState<{
    username: string;
    email: string;
    password: string;
    roles: string[];
  }>({
    username: '',
    email: '',
    password: '',
    roles: ['user'],
  });
  const [showEditPassword, setShowEditPassword] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [copiedId, setCopiedId] = useState<boolean>(false);

  const [createFormData, setCreateFormData] = useState<CreateUserFormData>({
    username: '',
    password: '',
    email: '',
    roles: ['user'],
  });
  const [createErrors, setCreateErrors] = useState<FormErrors>({});
  const [showCreatePassword, setShowCreatePassword] = useState<boolean>(false);
  const [isCreating, setIsCreating] = useState<boolean>(false);

  const [dialogState, setDialogState] = useState<{
    isOpen: boolean;
    type: 'disable' | 'delete' | null;
    targetUser: User | null;
  }>({
    isOpen: false,
    type: null,
    targetUser: null,
  });

  const selectedUser = useMemo(() => {
    if (!selectedUserId) return null;
    return allUsers.find((u) => u._id === selectedUserId) ?? null;
  }, [allUsers, selectedUserId]);

  useEffect(() => {
    if (selectedUser) {
      setEditFormData({
        username: selectedUser.username || '',
        email: selectedUser.email || '',
        password: '',
        roles:
          selectedUser.roles && selectedUser.roles.length > 0
            ? [...selectedUser.roles]
            : ['user'],
      });
      setShowEditPassword(false);
    }
  }, [selectedUser]);

  const allRoles = useMemo(() => {
    const rolesSet = new Set<string>(AVAILABLE_ROLES);
    allUsers.forEach((u) => {
      if (u.roles) u.roles.forEach((r) => rolesSet.add(r));
    });
    return Array.from(rolesSet).sort();
  }, [AVAILABLE_ROLES, allUsers]);

  const filteredUsers = useMemo(() => {
    return allUsers.filter((user) => {
      const isUserDisabled = user.status === 'disabled';
      if (statusFilter === 'active' && isUserDisabled) return false;
      if (statusFilter === 'disabled' && !isUserDisabled) return false;

      if (roleFilter.length > 0) {
        const hasRole = user.roles && user.roles.some((r) => roleFilter.includes(r));
        if (!hasRole) return false;
      }

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

  const totalPages = Math.max(1, Math.ceil(sortedUsers.length / usersPerPage));
  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = sortedUsers.slice(indexOfFirstUser, indexOfLastUser);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

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
      roles: ['user'],
    });
    setCreateErrors({});
  };

  const handleCloseRightPanel = () => {
    setSelectedUserId(null);
    setIsCreateMode(false);
  };

  const toggleRoleFilter = (role: string) => {
    setRoleFilter((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
    );
    setCurrentPage(1);
  };

  const handleEditRoleToggle = (role: string) => {
    setEditFormData((prev) => {
      const currentRoles = prev.roles;
      if (currentRoles.includes(role)) {
        if (currentRoles.length === 1) {
          showError('User must have at least one role');
          return prev;
        }
        return { ...prev, roles: currentRoles.filter((r) => r !== role) };
      }
      return { ...prev, roles: [...currentRoles, role] };
    });
  };

  const handleCreateRoleToggle = (role: string) => {
    setCreateFormData((prev) => {
      const currentRoles = prev.roles;
      if (currentRoles.includes(role)) {
        if (currentRoles.length === 1) {
          showError('User must have at least one role');
          return prev;
        }
        return { ...prev, roles: currentRoles.filter((r) => r !== role) };
      }
      return { ...prev, roles: [...currentRoles, role] };
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
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : `Failed to ${type} user`;
      showError(msg);
    } finally {
      setDialogState({ isOpen: false, type: null, targetUser: null });
    }
  };

  const handleEnableUser = async (user: User) => {
    try {
      await approveUserMutation.mutateAsync(user._id);
      showSuccess(`User "${user.username}" enabled`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to enable user';
      showError(msg);
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
      const payload: Partial<User> & { password?: string } = {
        username: editFormData.username.trim(),
        roles: editFormData.roles,
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
        updateData: payload,
      });

      showSuccess(`User "${editFormData.username}" updated successfully`);
      setEditFormData((prev) => ({ ...prev, password: '' }));
      setShowEditPassword(false);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update user';
      showError(msg);
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
        status: 'active',
      });

      showSuccess(`User "${createFormData.username}" created successfully`);
      setIsCreateMode(false);
      setCreateFormData({
        username: '',
        password: '',
        email: '',
        roles: ['user'],
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to create user';
      showError(msg);
    } finally {
      setIsCreating(false);
    }
  };

  const copyUserId = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const activeCount = useMemo(
    () => allUsers.filter((u) => u.status !== 'disabled').length,
    [allUsers]
  );
  const disabledCount = useMemo(
    () => allUsers.filter((u) => u.status === 'disabled').length,
    [allUsers]
  );

  return {
    allUsers,
    loading,
    error,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    roleFilter,
    currentPage,
    setCurrentPage,
    totalPages,
    currentUsers,
    sortedUsers,
    selectedUserId,
    selectedUser,
    isCreateMode,
    editFormData,
    setEditFormData,
    showEditPassword,
    setShowEditPassword,
    isSaving,
    copiedId,
    createFormData,
    setCreateFormData,
    createErrors,
    showCreatePassword,
    setShowCreatePassword,
    isCreating,
    dialogState,
    setDialogState,
    allRoles,
    activeCount,
    disabledCount,
    handleSelectUser,
    handleStartCreate,
    handleCloseRightPanel,
    toggleRoleFilter,
    handleEditRoleToggle,
    handleCreateRoleToggle,
    handleConfirmDialog,
    handleEnableUser,
    handleSaveEdit,
    handleCreateSubmit,
    copyUserId,
  };
}
