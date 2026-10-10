'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
  FaTimes,
  FaDiscord,
  FaCube,
  FaCopy,
  FaUser,
  FaEnvelope,
  FaLock,
  FaEye,
  FaEyeSlash,
  FaCheck,
  FaBan,
  FaTrashAlt,
} from 'react-icons/fa';
import { User } from '@/types/adminTypes';
import { getUserAvatarUrl, handleAvatarError } from '@/utils/generateAvatar';
import { getRoleBadgeClasses } from '../utils/roleBadgeHelper';
import { Button } from '@/components/common/Button';

interface UserEditPanelProps {
  user: User;
  allRoles: string[];
  editFormData: {
    username: string;
    email: string;
    password: string;
    roles: string[];
  };
  setEditFormData: React.Dispatch<
    React.SetStateAction<{
      username: string;
      email: string;
      password: string;
      roles: string[];
    }>
  >;
  showEditPassword: boolean;
  setShowEditPassword: React.Dispatch<React.SetStateAction<boolean>>;
  isSaving: boolean;
  copiedId: boolean;
  onCopyUserId: (id: string) => void;
  onClose: () => void;
  onSaveEdit: (e: React.FormEvent) => void;
  onRoleToggle: (role: string) => void;
  onEnableUser: (user: User) => void;
  onOpenDisableModal: (user: User) => void;
  onOpenDeleteModal: (user: User) => void;
}

export const UserEditPanel: React.FC<UserEditPanelProps> = ({
  user,
  allRoles,
  editFormData,
  setEditFormData,
  showEditPassword,
  setShowEditPassword,
  isSaving,
  copiedId,
  onCopyUserId,
  onClose,
  onSaveEdit,
  onRoleToggle,
  onEnableUser,
  onOpenDisableModal,
  onOpenDeleteModal,
}) => {
  const avatarUrl = getUserAvatarUrl(user.username, user.profilePicture, 96);
  const isDisabled = user.status === 'disabled';

  return (
    <motion.div
      key={`edit-${user._id}`}
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.2 }}
      className="bg-cc-card border border-border p-5 sm:p-6 rounded-2xl shadow-xs"
    >
      {/* Editor Header */}
      <div className="flex items-start justify-between gap-3 pb-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full overflow-hidden border border-border bg-cc-ground shrink-0">
            <img
              src={avatarUrl}
              alt={user.username}
              className="w-full h-full object-cover"
              onError={(e) => handleAvatarError(e, user.username, 96)}
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold text-foreground leading-tight">
                {user.username}
              </h2>
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  isDisabled ? 'bg-primary' : 'bg-emerald-500'
                }`}
                title={isDisabled ? 'Disabled' : 'Active'}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">Edit User Account & Roles</p>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors cursor-pointer"
          title="Close Editor"
        >
          <FaTimes size={14} />
        </button>
      </div>

      {/* ID & Discord Info Strip */}
      <div className="flex items-center justify-between gap-2 py-2.5 px-3.5 my-4 bg-cc-ground rounded-xl border border-border text-xs">
        <div className="flex items-center gap-1.5 text-muted-foreground truncate">
          <span className="font-mono text-muted-foreground/80">ID:</span>
          <span className="font-mono text-muted-foreground truncate max-w-[120px]">
            {user._id}
          </span>
          <button
            type="button"
            onClick={() => onCopyUserId(user._id)}
            className="text-muted-foreground hover:text-foreground ml-1 cursor-pointer"
            title="Copy ID"
          >
            <FaCopy size={11} />
          </button>
          {copiedId && <span className="text-emerald-400 text-[10px]">Copied!</span>}
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <FaDiscord
              style={{ color: user.discordId ? '#5865F2' : '#717171' }}
            />
            <span className="truncate max-w-[110px]">
              {user.discordUsername || 'No Discord'}
            </span>
          </div>

          {user.ccId && (
            <div className="flex items-center gap-1.5 text-sky-400" title={`CC ID: ${user.ccId}`}>
              <FaCube className="text-xs shrink-0" />
              <span className="truncate max-w-[110px]">
                {user.ccUsername || 'CC User'}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Edit Form */}
      <form onSubmit={onSaveEdit} className="space-y-4">
        {/* Username Field */}
        <div>
          <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
            Username <span className="text-primary">*</span>
          </label>
          <div className="relative">
            <input
              type="text"
              value={editFormData.username}
              onChange={(e) =>
                setEditFormData((prev) => ({ ...prev, username: e.target.value }))
              }
              required
              className="w-full pl-9 pr-3.5 py-2 bg-cc-ground border border-border rounded-xl text-xs text-foreground focus:outline-none focus:border-border/80"
            />
            <FaUser className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs" />
          </div>
        </div>

        {/* Email Field */}
        <div>
          <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
            Email Address
          </label>
          <div className="relative">
            <input
              type="email"
              value={editFormData.email}
              onChange={(e) =>
                setEditFormData((prev) => ({ ...prev, email: e.target.value }))
              }
              placeholder="user@example.com"
              className="w-full pl-9 pr-3.5 py-2 bg-cc-ground border border-border rounded-xl text-xs text-foreground placeholder-muted-foreground/60 focus:outline-none focus:border-border/80"
            />
            <FaEnvelope className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs" />
          </div>
        </div>

        {/* Password Reset Field */}
        <div>
          <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
            Reset Password{' '}
            <span className="text-[10px] text-muted-foreground/70 normal-case">
              (leave blank to keep unchanged)
            </span>
          </label>
          <div className="relative">
            <input
              type={showEditPassword ? 'text' : 'password'}
              value={editFormData.password}
              onChange={(e) =>
                setEditFormData((prev) => ({ ...prev, password: e.target.value }))
              }
              placeholder="Enter new password..."
              className="w-full pl-9 pr-10 py-2 bg-cc-ground border border-border rounded-xl text-xs text-foreground placeholder-muted-foreground/60 focus:outline-none focus:border-border/80"
            />
            <FaLock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs" />
            <button
              type="button"
              onClick={() => setShowEditPassword((prev) => !prev)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
            >
              {showEditPassword ? <FaEyeSlash size={13} /> : <FaEye size={13} />}
            </button>
          </div>
        </div>

        {/* Roles Multi-Select */}
        <div>
          <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            Assigned Roles <span className="text-primary">*</span>
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {allRoles.map((role) => {
              const isAssigned = editFormData.roles.includes(role);
              return (
                <button
                  type="button"
                  key={role}
                  onClick={() => onRoleToggle(role)}
                  className={`p-2 rounded-xl text-xs font-medium capitalize flex items-center justify-between border transition-all cursor-pointer ${
                    isAssigned
                      ? getRoleBadgeClasses(role, true)
                      : 'bg-cc-ground text-muted-foreground border-border hover:border-border/80'
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
        <div className="pt-3 border-t border-border">
          <span className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            Account Status & Actions
          </span>
          <div className="grid grid-cols-2 gap-2">
            {isDisabled ? (
              <button
                type="button"
                onClick={() => onEnableUser(user)}
                className="px-3 py-2 rounded-xl text-xs font-medium bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border border-emerald-500/30 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <FaCheck />
                <span>Enable User</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => onOpenDisableModal(user)}
                className="px-3 py-2 rounded-xl text-xs font-medium bg-amber-500/15 hover:bg-amber-500/25 text-amber-400 border border-amber-500/30 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <FaBan />
                <span>Disable User</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => onOpenDeleteModal(user)}
              className="px-3 py-2 rounded-xl text-xs font-medium bg-primary/15 hover:bg-primary/25 text-primary border border-primary/30 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <FaTrashAlt />
              <span>Delete User</span>
            </button>
          </div>
        </div>

        {/* Save & Cancel Buttons */}
        <div className="flex items-center justify-end gap-2 pt-4 border-t border-border">
          <Button
            type="button"
            variant="card"
            size="sm"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="sm"
            isLoading={isSaving}
            leftIcon={<FaCheck />}
          >
            Save Changes
          </Button>
        </div>
      </form>
    </motion.div>
  );
};

export default UserEditPanel;
