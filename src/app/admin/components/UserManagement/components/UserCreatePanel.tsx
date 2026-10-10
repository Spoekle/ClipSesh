'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
  FaUserPlus,
  FaTimes,
  FaUser,
  FaEnvelope,
  FaLock,
  FaEye,
  FaEyeSlash,
  FaCheck,
} from 'react-icons/fa';
import { CreateUserFormData, FormErrors } from '@/types/adminTypes';
import { getRoleBadgeClasses } from '../utils/roleBadgeHelper';
import { Button } from '@/components/common/Button';

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
            <FaUserPlus />
          </div>
          <div>
            <h2 className="text-base font-bold text-foreground">Create New User</h2>
            <p className="text-xs text-muted-foreground">Add a new account to ClipSesh</p>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors cursor-pointer"
        >
          <FaTimes size={14} />
        </button>
      </div>

      {/* Create Form */}
      <form onSubmit={onCreateSubmit} className="space-y-4 mt-4">
        {/* Username */}
        <div>
          <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">
            Username <span className="text-primary">*</span>
          </label>
          <div className="relative">
            <input
              type="text"
              value={createFormData.username}
              onChange={(e) =>
                setCreateFormData((prev) => ({ ...prev, username: e.target.value }))
              }
              placeholder="e.g. SpeedRunner42"
              className={`w-full pl-9 pr-3.5 py-2 bg-cc-ground border rounded-xl text-xs text-foreground placeholder-muted-foreground/60 focus:outline-none ${
                createErrors.username
                  ? 'border-primary'
                  : 'border-border focus:border-border/80'
              }`}
            />
            <FaUser className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs" />
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
            <input
              type="email"
              value={createFormData.email ?? ''}
              onChange={(e) =>
                setCreateFormData((prev) => ({ ...prev, email: e.target.value }))
              }
              placeholder="user@example.com"
              className={`w-full pl-9 pr-3.5 py-2 bg-cc-ground border rounded-xl text-xs text-foreground placeholder-muted-foreground/60 focus:outline-none ${
                createErrors.email
                  ? 'border-primary'
                  : 'border-border focus:border-border/80'
              }`}
            />
            <FaEnvelope className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs" />
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
            <input
              type={showCreatePassword ? 'text' : 'password'}
              value={createFormData.password}
              onChange={(e) =>
                setCreateFormData((prev) => ({ ...prev, password: e.target.value }))
              }
              placeholder="Minimum 6 characters"
              className={`w-full pl-9 pr-10 py-2 bg-cc-ground border rounded-xl text-xs text-foreground placeholder-muted-foreground/60 focus:outline-none ${
                createErrors.password
                  ? 'border-primary'
                  : 'border-border focus:border-border/80'
              }`}
            />
            <FaLock className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs" />
            <button
              type="button"
              onClick={() => setShowCreatePassword((prev) => !prev)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
            >
              {showCreatePassword ? <FaEyeSlash size={13} /> : <FaEye size={13} />}
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
                  {isAssigned && <FaCheck className="text-[10px]" />}
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
            variant="card"
            size="sm"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="success"
            size="sm"
            isLoading={isCreating}
            leftIcon={<FaUserPlus />}
          >
            Create User
          </Button>
        </div>
      </form>
    </motion.div>
  );
};

export default UserCreatePanel;
