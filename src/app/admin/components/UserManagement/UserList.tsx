'use client';

import React from 'react';
import { AnimatePresence } from 'framer-motion';
import {
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  AlertTriangle,
  UserPlus,
  Loader2,
} from 'lucide-react';
import { User } from '@/types/adminTypes';
import ConfirmationDialog from '@/components/common/ConfirmationDialog';
import { Button } from '@/components/ui/button';
import { UserFilterBar } from './components/UserFilterBar';
import { UserCard } from './components/UserCard';
import { UserEditPanel } from './components/UserEditPanel';
import { UserCreatePanel } from './components/UserCreatePanel';
import { UserEmptyPanel } from './components/UserEmptyPanel';
import { useUserManagementState } from './hooks/useUserManagementState';

interface UserListProps {
  fetchUsers?: () => void;
  disabledUsers?: User[];
  setDisabledUsers?: React.Dispatch<React.SetStateAction<User[]>>;
  AVAILABLE_ROLES: string[];
}

export const UserList: React.FC<UserListProps> = ({ AVAILABLE_ROLES }) => {
  const {
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
  } = useUserManagementState(AVAILABLE_ROLES);

  return (
    <div className="w-full">
      {/* Top Header Card */}
      <div className="bg-cc-card border border-border p-5 sm:p-6 rounded-2xl mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="size-11 rounded-xl bg-primary/15 text-primary flex items-center justify-center">
            <ShieldCheck className="size-5" />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-foreground tracking-tight flex items-center gap-2">
              User Management
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Manage user accounts, roles, access permissions, and credentials
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Button
            type="button"
            variant="default"
            size="sm"
            onClick={handleStartCreate}
            className={`w-full sm:w-auto gap-1.5 font-semibold ${
              isCreateMode ? 'bg-emerald-600 hover:bg-emerald-500 text-white' : 'bg-primary text-white hover:bg-primary/90'
            }`}
          >
            <UserPlus className="size-3.5" />
            <span>New User</span>
          </Button>
        </div>
      </div>

      {/* Main Split Layout: Left (Master List) | Right (Editor Panel) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: User Directory & Filters (7 Columns) */}
        <div className="lg:col-span-7 space-y-4">
          <UserFilterBar
            search={search}
            setSearch={(val) => {
              setSearch(val);
              setCurrentPage(1);
            }}
            statusFilter={statusFilter}
            setStatusFilter={(val) => {
              setStatusFilter(val);
              setCurrentPage(1);
            }}
            roleFilter={roleFilter}
            toggleRoleFilter={toggleRoleFilter}
            clearRoleFilter={() => toggleRoleFilter('')}
            allRoles={allRoles}
            totalUsersCount={allUsers.length}
            activeCount={activeCount}
            disabledCount={disabledCount}
            filteredCount={allUsers.length}
          />

          {/* User List Rows */}
          <div className="grid sm:grid-cols-2 grid-cols-1 gap-2">
            {loading ? (
              <div className="bg-cc-card border border-border p-12 rounded-xl flex flex-col items-center justify-center col-span-full">
                <Loader2 className="size-7 animate-spin text-primary mb-3" />
                <p className="text-xs text-muted-foreground">Loading users...</p>
              </div>
            ) : error ? (
              <div className="bg-cc-card border border-primary/40 p-6 rounded-xl text-primary flex items-center gap-3 col-span-full">
                <AlertTriangle className="size-5 shrink-0" />
                <span className="text-xs">{error instanceof Error ? error.message : 'Failed to load users'}</span>
              </div>
            ) : currentUsers.length === 0 ? (
              <div className="bg-cc-card border border-border p-10 rounded-xl text-center col-span-full">
                <AlertTriangle className="size-8 text-amber-400 mx-auto mb-3" />
                <h3 className="text-sm font-semibold text-foreground mb-1">No Users Found</h3>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto mb-4">
                  No users matched your current search and role filters.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSearch('');
                    setStatusFilter('all');
                  }}
                  className="px-3.5 py-1.5 bg-cc-ground hover:bg-white/5 text-xs font-medium text-foreground rounded-lg transition-colors cursor-pointer"
                >
                  Reset Filters
                </button>
              </div>
            ) : (
              currentUsers.map((user) => (
                <UserCard
                  key={user._id}
                  user={user}
                  isSelected={selectedUserId === user._id && !isCreateMode}
                  onSelect={handleSelectUser}
                />
              ))
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="bg-cc-card border border-border p-3 rounded-xl flex items-center justify-between text-xs text-muted-foreground">
              <button
                type="button"
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 bg-cc-ground hover:bg-white/5 disabled:opacity-30 border border-border rounded-lg transition-colors flex items-center gap-1.5 text-muted-foreground hover:text-foreground cursor-pointer disabled:cursor-not-allowed"
              >
                <ChevronLeft className="size-3" />
                <span>Prev</span>
              </button>

              <span className="text-muted-foreground">
                Page {currentPage} of {totalPages}
              </span>

              <button
                type="button"
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 bg-cc-ground hover:bg-white/5 disabled:opacity-30 border border-border rounded-lg transition-colors flex items-center gap-1.5 text-muted-foreground hover:text-foreground cursor-pointer disabled:cursor-not-allowed"
              >
                <span>Next</span>
                <ChevronRight className="size-3" />
              </button>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Dedicated Editor & Creator Panel (5 Columns, Sticky) */}
        <div className="lg:col-span-5 lg:sticky lg:top-6">
          <AnimatePresence mode="wait">
            {selectedUser && !isCreateMode ? (
              <UserEditPanel
                user={selectedUser}
                allRoles={allRoles}
                editFormData={editFormData}
                setEditFormData={setEditFormData}
                showEditPassword={showEditPassword}
                setShowEditPassword={setShowEditPassword}
                isSaving={isSaving}
                copiedId={copiedId}
                onCopyUserId={copyUserId}
                onClose={handleCloseRightPanel}
                onSaveEdit={handleSaveEdit}
                onRoleToggle={handleEditRoleToggle}
                onEnableUser={handleEnableUser}
                onOpenDisableModal={(u) =>
                  setDialogState({ isOpen: true, type: 'disable', targetUser: u })
                }
                onOpenDeleteModal={(u) =>
                  setDialogState({ isOpen: true, type: 'delete', targetUser: u })
                }
              />
            ) : isCreateMode ? (
              <UserCreatePanel
                allRoles={allRoles}
                createFormData={createFormData}
                setCreateFormData={setCreateFormData}
                createErrors={createErrors}
                showCreatePassword={showCreatePassword}
                setShowCreatePassword={setShowCreatePassword}
                isCreating={isCreating}
                onCreateSubmit={handleCreateSubmit}
                onRoleToggle={handleCreateRoleToggle}
                onClose={handleCloseRightPanel}
              />
            ) : (
              <UserEmptyPanel onStartCreate={handleStartCreate} />
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
        confirmVariant="danger"
        onConfirm={handleConfirmDialog}
        onCancel={() => setDialogState({ isOpen: false, type: null, targetUser: null })}
      />
    </div>
  );
};

export default UserList;
