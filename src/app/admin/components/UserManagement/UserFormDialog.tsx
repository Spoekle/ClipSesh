'use client';

import React, { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { DiscordIcon } from '@/components/BrandIcons';
import { User } from '@/types/adminTypes';
import { useNotification } from '@/context/AlertContext';
import {
  useApproveUser,
  useCreateUser,
  useDeleteUser,
  useDisableUser,
  useUpdateUser,
} from '@/hooks/useAdmin';
import ConfirmationDialog from '@/components/common/ConfirmationDialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { getRoleBadgeClasses } from './utils/roleBadgeHelper';

interface UserFormDialogProps {
  /** `null` opens the dialog in create mode. */
  user: User | null;
  roles: string[];
  onClose: () => void;
}

/** Create or edit a single user. Remount (via `key`) to reset form state per user. */
export const UserFormDialog: React.FC<UserFormDialogProps> = ({ user, roles, onClose }) => {
  const isCreate = user === null;
  const isDisabled = user?.status === 'disabled';
  const { showSuccess, showError } = useNotification();

  const [username, setUsername] = useState(user?.username ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [password, setPassword] = useState('');
  const [selectedRoles, setSelectedRoles] = useState<string[]>(user?.roles.length ? user.roles : ['user']);
  const [confirm, setConfirm] = useState<'disable' | 'delete' | null>(null);

  const createUser = useCreateUser();
  const updateUser = useUpdateUser();
  const disableUser = useDisableUser();
  const approveUser = useApproveUser();
  const deleteUser = useDeleteUser();
  const isSaving = createUser.isPending || updateUser.isPending;

  const toggleRole = (role: string) => {
    setSelectedRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role],
    );
  };

  const run = async (action: () => Promise<unknown>, success: string) => {
    try {
      await action();
      showSuccess(success);
      onClose();
    } catch (err: unknown) {
      showError(err instanceof Error ? err.message : 'Something went wrong');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const name = username.trim();
    if (!name) return showError('Username is required');
    if (selectedRoles.length === 0) return showError('Pick at least one role');
    if ((isCreate || password) && password.length < 6) {
      return showError('Password must be at least 6 characters');
    }

    if (isCreate) {
      void run(
        () => createUser.mutateAsync({ username: name, password, email: email.trim(), roles: selectedRoles, status: 'active' }),
        `Created ${name}`,
      );
      return;
    }

    const updateData: Partial<User> = { username: name, roles: selectedRoles };
    if (email.trim()) updateData.email = email.trim();
    if (password) updateData.password = password;
    void run(() => updateUser.mutateAsync({ userId: user._id, updateData }), `Saved ${name}`);
  };

  const handleConfirm = () => {
    if (!user) return;
    if (confirm === 'delete') void run(() => deleteUser.mutateAsync(user._id), `Deleted ${user.username}`);
    if (confirm === 'disable') void run(() => disableUser.mutateAsync(user._id), `Disabled ${user.username}`);
    setConfirm(null);
  };

  return (
    <>
      <Dialog open onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{isCreate ? 'New user' : user.username}</DialogTitle>
            <DialogDescription>
              {isCreate ? 'Create an account and assign roles.' : (
                <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <span className={isDisabled ? 'text-primary' : 'text-emerald-400'}>
                    {isDisabled ? 'Disabled' : 'Active'}
                  </span>
                  {user.discordUsername && (
                    <span className="inline-flex items-center gap-1">
                      <DiscordIcon className="text-[#5865F2]" /> {user.discordUsername}
                    </span>
                  )}
                  <span className="font-mono text-[11px]">{user._id}</span>
                </span>
              )}
            </DialogDescription>
          </DialogHeader>

          <form id="user-form" onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="user-username">Username</Label>
                <Input id="user-username" value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="off" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="user-email">Email</Label>
                <Input id="user-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Optional" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="user-password">{isCreate ? 'Password' : 'New password'}</Label>
              <Input
                id="user-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={isCreate ? 'At least 6 characters' : 'Leave blank to keep current'}
                autoComplete="new-password"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Roles</Label>
              <div className="flex flex-wrap gap-1.5">
                {roles.map((role) => (
                  <button
                    key={role}
                    type="button"
                    onClick={() => toggleRole(role)}
                    aria-pressed={selectedRoles.includes(role)}
                    className={cn(
                      'rounded-full px-3 py-1 text-xs font-medium capitalize transition-colors',
                      getRoleBadgeClasses(role, selectedRoles.includes(role)),
                    )}
                  >
                    {role}
                  </button>
                ))}
              </div>
            </div>
          </form>

          <DialogFooter className="sm:justify-between">
            {!isCreate ? (
              <div className="flex gap-2">
                {isDisabled ? (
                  <Button type="button" variant="outline" size="sm" onClick={() => run(() => approveUser.mutateAsync(user._id), `Enabled ${user.username}`)}>
                    Enable
                  </Button>
                ) : (
                  <Button type="button" variant="outline" size="sm" onClick={() => setConfirm('disable')}>
                    Disable
                  </Button>
                )}
                <Button type="button" variant="ghost" size="sm" className="text-primary hover:text-primary" onClick={() => setConfirm('delete')}>
                  Delete
                </Button>
              </div>
            ) : <span />}
            <Button type="submit" form="user-form" size="sm" disabled={isSaving} className="gap-1.5">
              {isSaving && <Loader2 className="size-3.5 animate-spin" />}
              {isCreate ? 'Create user' : 'Save changes'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmationDialog
        isOpen={confirm !== null}
        title={confirm === 'delete' ? 'Delete user' : 'Disable user'}
        message={
          confirm === 'delete'
            ? `Permanently delete "${user?.username}"? This cannot be undone.`
            : `Disable "${user?.username}"? They won't be able to log in.`
        }
        confirmText={confirm === 'delete' ? 'Delete' : 'Disable'}
        confirmVariant="danger"
        onConfirm={handleConfirm}
        onCancel={() => setConfirm(null)}
      />
    </>
  );
};

export default UserFormDialog;
