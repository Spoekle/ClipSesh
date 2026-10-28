'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
  UserPlus,
  X,
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Check,
  Loader2,
} from 'lucide-react';
import { CreateUserFormData, FormErrors } from '@/types/adminTypes';
import { getRoleBadgeClasses } from '../utils/roleBadgeHelper';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface UserCreatePanelProps {
  allRoles: string[];
  createFormData: CreateUserFormData;
  setCreateFormData: React.Dispatch<React.SetStateAction<CreateUserFormData>>;
  createErrors: FormErrors;
  showCreatePassword: boolean;
  setShowCreatePassword: React.Dispatch<React.SetStateAction<boolean>>;
  isCreating: boolean;
  onCreateSubmit: (e: React.FormEvent) => void;
  onRoleToggle: (role: string) => void;
  onClose: () => void;
}

export const UserCreatePanel: React.FC<UserCreatePanelProps> = ({
  allRoles,
  createFormData,
  setCreateFormData,
  createErrors,
  showCreatePassword,
  setShowCreatePassword,
  isCreating,
  onCreateSubmit,
  onRoleToggle,
  onClose,
}) => {
  return (
    <motion.div
      key="create-mode"
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.2 }}
      className="bg-cc-card border border-border p-5 sm:p-6 rounded-2xl shadow-xs"
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-3 pb-4 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-400 flex items-center justify-center text-base">
            <UserPlus className="size-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-foreground">Create New User</h2>
            <p className="text-xs text-muted-foreground">Add a new account to ClipSesh</p>
          </div>
        </div>

        <Button
          type="button"
          variant="ghost"
          size="icon-xs"
          onClick={onClose}
        >
          <X className="size-4" />
        </Button>
      </div>

      {/* Create Form */}
      <form onSubmit={onCreateSubmit} className="space-y-4 mt-4">
        {/* Username */}
        <div>
          <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
            Username <span className="text-primary">*</span>
          </label>
          <div className="relative">
            <Input
              type="text"
              value={createFormData.username}
              onChange={(e) =>
                setCreateFormData((prev) => ({ ...prev, username: e.target.value }))
              }
              placeholder="e.g. SpeedRunner42"
              className={`pl-9 bg-cc-ground text-xs placeholder:text-muted-foreground/60 ${
                createErrors.username
                  ? 'border-primary focus-visible:ring-primary/30'
                  : 'border-border'
              }`}
            />
            <User className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground size-3.5" />
          </div>
          {createErrors.username && (
            <p className="text-xs text-primary mt-1">{createErrors.username}</p>
          )}
        </div>

        {/* Email */}
        <div>
          <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
            Email Address
          </label>
          <div className="relative">
            <Input
              type="email"
              value={createFormData.email ?? ''}
              onChange={(e) =>
                setCreateFormData((prev) => ({ ...prev, email: e.target.value }))
              }
              placeholder="user@example.com"
              className={`pl-9 bg-cc-ground text-xs placeholder:text-muted-foreground/60 ${
                createErrors.email
                  ? 'border-primary focus-visible:ring-primary/30'
                  : 'border-border'
              }`}
            />
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground size-3.5" />
          </div>
          {createErrors.email && (
            <p className="text-xs text-primary mt-1">{createErrors.email}</p>
          )}
        </div>

        {/* Password */}
        <div>
          <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
            Password <span className="text-primary">*</span>
          </label>
          <div className="relative">
            <Input
              type={showCreatePassword ? 'text' : 'password'}
              value={createFormData.password}
              onChange={(e) =>
                setCreateFormData((prev) => ({ ...prev, password: e.target.value }))
              }
              placeholder="Minimum 6 characters"
              className={`pl-9 pr-10 bg-cc-ground text-xs placeholder:text-muted-foreground/60 ${
                createErrors.password
                  ? 'border-primary focus-visible:ring-primary/30'
                  : 'border-border'
              }`}
            />
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground size-3.5" />
            <button
              type="button"
              onClick={() => setShowCreatePassword((prev) => !prev)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
            >
              {showCreatePassword ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
            </button>
          </div>
          {createErrors.password && (
            <p className="text-xs text-primary mt-1">{createErrors.password}</p>
          )}
        </div>

        {/* Roles */}
        <div>
          <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            Assigned Roles <span className="text-primary">*</span>
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {allRoles.map((role) => {
              const isAssigned = createFormData.roles.includes(role);
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
          {createErrors.roles && (
            <p className="text-xs text-primary mt-1">{createErrors.roles}</p>
          )}
        </div>

        {/* Footer actions */}
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
            disabled={isCreating}
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-medium"
          >
            {isCreating ? (
              <>
                <Loader2 className="size-3.5 animate-spin mr-1.5" />
                Creating User...
              </>
            ) : (
              <>
                <UserPlus className="size-3.5 mr-1.5" />
                Create User
              </>
            )}
          </Button>
        </div>
      </form>
    </motion.div>
  );
};

export default UserCreatePanel;
