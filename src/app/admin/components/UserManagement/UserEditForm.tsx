'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { FaCheck, FaTimes } from 'react-icons/fa';
import { User } from '@/types/adminTypes';
import { Button } from '@/components/common/Button';

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
    <div className="fixed inset-0 z-50 overflow-auto bg-black/75 backdrop-blur-xs flex items-center justify-center p-4 select-none">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        transition={{ type: "spring", duration: 0.3 }}
        className="bg-cc-card text-foreground rounded-2xl shadow-2xl max-w-md w-full mx-auto border border-border overflow-hidden"
      >
        <div className="px-6 py-4 border-b border-border bg-cc-ground flex justify-between items-center">
          <h3 className="text-base font-bold text-white">Edit User: {editUser.username}</h3>
          <button
            type="button"
            onClick={() => setEditUser(null)}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-white hover:bg-white/5 transition-colors cursor-pointer"
          >
            <FaTimes size={14} />
          </button>
        </div>
        <div className="p-6">
          <form onSubmit={handleEditSubmit} className="space-y-4 text-xs">
            <div>
              <label htmlFor="username" className="block text-xs font-semibold uppercase tracking-wider mb-1.5 text-muted-foreground">Username:</label>
              <input
                type="text"
                id="username"
                name="username"
                value={editUser.username}
                onChange={handleEditChange}
                className="w-full px-3 py-2 bg-cc-ground border border-border rounded-xl text-xs text-white focus:outline-none focus:border-border/80 transition-colors"
                required
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-xs font-semibold uppercase tracking-wider mb-1.5 text-muted-foreground">Email:</label>
              <input
                type="email"
                id="email"
                name="email"
                value={editUser.email || ''}
                onChange={handleEditChange}
                className="w-full px-3 py-2 bg-cc-ground border border-border rounded-xl text-xs text-white focus:outline-none focus:border-border/80 transition-colors"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-semibold uppercase tracking-wider mb-1.5 text-muted-foreground">
                Password (leave blank to keep unchanged):
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={editUser.password || ''}
                onChange={handleEditChange}
                className="w-full px-3 py-2 bg-cc-ground border border-border rounded-xl text-xs text-white focus:outline-none focus:border-border/80 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-2 text-muted-foreground">Roles:</label>
              <div className="grid grid-cols-2 gap-2">
                {[...AVAILABLE_ROLES].sort().map(role => (
                  <label key={role} className="flex items-center space-x-2 cursor-pointer p-2.5 rounded-xl border border-border bg-cc-ground hover:bg-white/5 transition-colors">
                    <input
                      type="checkbox"
                      name="roles"
                      value={role}
                      checked={editUser.roles.includes(role)}
                      onChange={handleEditChange}
                      className="hidden"
                      disabled={editUser.roles.length === 1 && editUser.roles.includes(role)}
                    />
                    <div className={`w-4 h-4 rounded-md flex items-center justify-center transition-colors ${editUser.roles.includes(role)
                        ? 'bg-primary text-white'
                        : 'bg-cc-card border border-border text-transparent'
                      }`}>
                      {editUser.roles.includes(role) && <FaCheck className="text-[10px]" />}
                    </div>
                    <span className="capitalize text-xs font-medium text-white">{role}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2.5 pt-4 border-t border-border mt-4">
              <Button
                type="button"
                variant="card"
                size="sm"
                onClick={() => setEditUser(null)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                isLoading={isLoading}
                leftIcon={<FaCheck size={11} />}
              >
                Save Changes
              </Button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
};

export default UserEditForm;
