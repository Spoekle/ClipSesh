'use client';

import React from 'react';
import { Check, Loader2 } from 'lucide-react';
import { User } from '@/types/adminTypes';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

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
  AVAILABLE_ROLES,
}) => {
  if (!editUser) return null;

  return (
    <Dialog
      open={Boolean(editUser)}
      onOpenChange={(open) => {
        if (!open) setEditUser(null);
      }}
    >
      <DialogContent className="max-w-md bg-cc-card border-border text-foreground p-0 overflow-hidden">
        <DialogHeader className="px-6 py-4 border-b border-border bg-cc-ground">
          <DialogTitle className="text-base font-bold text-foreground">
            Edit User: {editUser.username}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Update user credentials and permission roles
          </DialogDescription>
        </DialogHeader>

        <div className="p-6">
          <form onSubmit={handleEditSubmit} className="space-y-4 text-xs">
            <div>
              <label
                htmlFor="username"
                className="block text-xs font-semibold uppercase tracking-wider mb-1.5 text-muted-foreground"
              >
                Username:
              </label>
              <Input
                type="text"
                id="username"
                name="username"
                value={editUser.username}
                onChange={handleEditChange}
                className="bg-cc-ground border-border text-xs"
                required
              />
            </div>

            <div>
              <label
                htmlFor="email"
                className="block text-xs font-semibold uppercase tracking-wider mb-1.5 text-muted-foreground"
              >
                Email:
              </label>
              <Input
                type="email"
                id="email"
                name="email"
                value={editUser.email || ''}
                onChange={handleEditChange}
                className="bg-cc-ground border-border text-xs"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-xs font-semibold uppercase tracking-wider mb-1.5 text-muted-foreground"
              >
                Password (leave blank to keep unchanged):
              </label>
              <Input
                type="password"
                id="password"
                name="password"
                value={editUser.password || ''}
                onChange={handleEditChange}
                className="bg-cc-ground border-border text-xs"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-2 text-muted-foreground">
                Roles:
              </label>
              <div className="grid grid-cols-2 gap-2">
                {[...AVAILABLE_ROLES].sort().map((role) => (
                  <label
                    key={role}
                    className="flex items-center space-x-2 cursor-pointer p-2.5 rounded-xl border border-border bg-cc-ground hover:bg-white/5 transition-colors"
                  >
                    <input
                      type="checkbox"
                      name="roles"
                      value={role}
                      checked={editUser.roles.includes(role)}
                      onChange={handleEditChange}
                      className="hidden"
                      disabled={editUser.roles.length === 1 && editUser.roles.includes(role)}
                    />
                    <div
                      className={`w-4 h-4 rounded-md flex items-center justify-center transition-colors ${
                        editUser.roles.includes(role)
                          ? 'bg-primary text-white'
                          : 'bg-cc-card border border-border text-transparent'
                      }`}
                    >
                      {editUser.roles.includes(role) && <Check className="size-3" />}
                    </div>
                    <span className="capitalize text-xs font-medium text-foreground">{role}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-2.5 pt-4 border-t border-border mt-4">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setEditUser(null)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="default"
                size="sm"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="size-3.5 animate-spin mr-1.5" />
                    Saving...
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
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default UserEditForm;
