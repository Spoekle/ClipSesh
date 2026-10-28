'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
  X,
  Box,
  Copy,
  User as UserIcon,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Check,
  Ban,
  Trash2,
  Loader2,
} from 'lucide-react';
import { FaDiscord } from 'react-icons/fa';
import { User } from '@/types/adminTypes';
import { getUserAvatarUrl, handleAvatarError } from '@/utils/generateAvatar';
import { getRoleBadgeClasses } from '../utils/roleBadgeHelper';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

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

        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          onClick={onClose}
          title="Close Editor"
        >
          <X className="size-4" />
        </Button>
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
            <Copy className="size-3" />
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
              <Box className="size-3 shrink-0" />
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
            <Input
              type="text"
              value={editFormData.username}
              onChange={(e) =>
                setEditFormData((prev) => ({ ...prev, username: e.target.value }))
              }
              required
              className="pl-9 bg-cc-ground border-border text-xs"
            />
            <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground size-3.5" />
          </div>
        </div>

        {/* Email Field */}
        <div>
          <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">
            Email Address
          </label>
          <div className="relative">
            <Input
              type="email"
              value={editFormData.email}
              onChange={(e) =>
                setEditFormData((prev) => ({ ...prev, email: e.target.value }))
              }
              placeholder="user@example.com"
              className="pl-9 bg-cc-ground border-border text-xs placeholder:text-muted-foreground/60"
            />
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground size-3.5" />
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
            <Input
              type={showEditPassword ? 'text' : 'password'}
              value={editFormData.password}
              onChange={(e) =>
                setEditFormData((prev) => ({ ...prev, password: e.target.value }))
              }
              placeholder="Enter new password..."
              className="pl-9 pr-10 bg-cc-ground border-border text-xs placeholder:text-muted-foreground/60"
            />
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground size-3.5" />
            <button
              type="button"
              onClick={() => setShowEditPassword((prev) => !prev)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
            >
              {showEditPassword ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
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
                  {isAssigned && <Check className="size-3" />}
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
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onEnableUser(user)}
                className="bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border-emerald-500/30"
              >
                <Check className="size-3.5 mr-1.5" />
                <span>Enable User</span>
              </Button>
            ) : (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onOpenDisableModal(user)}
                className="bg-amber-500/15 hover:bg-amber-500/25 text-amber-400 border-amber-500/30"
              >
                <Ban className="size-3.5 mr-1.5" />
                <span>Disable User</span>
              </Button>
            )}

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenDeleteModal(user)}
              className="bg-primary/15 hover:bg-primary/25 text-primary border-primary/30"
            >
              <Trash2 className="size-3.5 mr-1.5" />
              <span>Delete User</span>
            </Button>
          </div>
        </div>

        {/* Save & Cancel Buttons */}
        <div className="flex items-center justify-end gap-2 pt-4 border-t border-border">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            size="sm"
            disabled={isSaving}
            className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium"
          >
            {isSaving ? (
              <>
                <Loader2 className="size-3.5 animate-spin mr-1.5" />
                Saving Changes...
              </>
            ) : (
              <>
                <Check className="size-3.5 mr-1.5" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </form>
    </motion.div>
  );
};

export default UserEditPanel;
