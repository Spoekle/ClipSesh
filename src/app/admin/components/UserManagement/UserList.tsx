'use client';

import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Loader2, Search, UserPlus } from 'lucide-react';
import { DiscordIcon } from '@/components/BrandIcons';
import { User } from '@/types/adminTypes';
import { useAllUsers } from '@/hooks/useAdmin';
import { getUserAvatarUrl, handleAvatarError } from '@/utils/generateAvatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import AdminSection from '../AdminSection';
import UserFormDialog from './UserFormDialog';
import { getRoleBadgeClasses } from './utils/roleBadgeHelper';

const AVAILABLE_ROLES = ['user', 'admin', 'editor', 'uploader', 'clipteam'];
const PAGE_SIZE = 15;

type StatusFilter = 'all' | 'active' | 'disabled';
type DialogTarget = { mode: 'create' } | { mode: 'edit'; userId: string } | null;

export const UserList: React.FC = () => {
  const { data: users = [], isLoading, error } = useAllUsers();

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<StatusFilter>('all');
  const [role, setRole] = useState('');
  const [page, setPage] = useState(1);
  const [dialog, setDialog] = useState<DialogTarget>(null);

  const roles = Array.from(new Set([...AVAILABLE_ROLES, ...users.flatMap((u) => u.roles)])).sort();
  const disabledCount = users.filter((u) => u.status === 'disabled').length;

  const query = search.trim().toLowerCase();
  const filtered = users
    .filter((u) => {
      const disabled = u.status === 'disabled';
      if (status === 'active' && disabled) return false;
      if (status === 'disabled' && !disabled) return false;
      if (role && !u.roles.includes(role)) return false;
      if (!query) return true;
      return [u.username, u.email, u.discordUsername].some((v) => v?.toLowerCase().includes(query));
    })
    .sort((a, b) => a.username.localeCompare(b.username));

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageUsers = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const editingUser = dialog?.mode === 'edit' ? users.find((u) => u._id === dialog.userId) : undefined;

  const statusOptions: { value: StatusFilter; label: string }[] = [
    { value: 'all', label: `All ${users.length}` },
    { value: 'active', label: `Active ${users.length - disabledCount}` },
    { value: 'disabled', label: `Disabled ${disabledCount}` },
  ];

  return (
    <AdminSection
      title="Users"
      description="Accounts, roles and access."
      actions={
        <Button size="sm" className="gap-1.5" onClick={() => setDialog({ mode: 'create' })}>
          <UserPlus className="size-3.5" /> New user
        </Button>
      }
    >
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative grow">
          <Search className="absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search username, email or Discord"
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-1 rounded-full border border-border bg-card p-1">
          {statusOptions.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => { setStatus(opt.value); setPage(1); }}
              className={cn(
                'rounded-full px-3 py-1 text-xs font-semibold whitespace-nowrap transition-colors',
                status === opt.value ? 'bg-foreground text-background' : 'text-muted-foreground hover:text-foreground',
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <select
          value={role}
          onChange={(e) => { setRole(e.target.value); setPage(1); }}
          aria-label="Filter by role"
          className="h-9 rounded-full border border-border bg-card px-3 text-xs font-semibold text-foreground capitalize"
        >
          <option value="">All roles</option>
          {roles.map((r) => <option key={r} value={r}>{r}</option>)}
        </select>
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        {isLoading ? (
          <div className="flex items-center justify-center gap-2 p-12 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin text-primary" /> Loading users
          </div>
        ) : error ? (
          <p className="p-6 text-sm text-primary">{error instanceof Error ? error.message : 'Failed to load users'}</p>
        ) : pageUsers.length === 0 ? (
          <p className="p-12 text-center text-sm text-muted-foreground">No users match these filters.</p>
        ) : (
          <ul className="divide-y divide-border">
            {pageUsers.map((user) => (
              <UserRow key={user._id} user={user} onSelect={() => setDialog({ mode: 'edit', userId: user._id })} />
            ))}
          </ul>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{filtered.length} users · page {currentPage} of {totalPages}</span>
          <div className="flex gap-1">
            <Button variant="outline" size="icon-sm" disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)} aria-label="Previous page">
              <ChevronLeft className="size-3.5" />
            </Button>
            <Button variant="outline" size="icon-sm" disabled={currentPage === totalPages} onClick={() => setPage(currentPage + 1)} aria-label="Next page">
              <ChevronRight className="size-3.5" />
            </Button>
          </div>
        </div>
      )}

      {dialog?.mode === 'create' && <UserFormDialog key="new" user={null} roles={roles} onClose={() => setDialog(null)} />}
      {editingUser && <UserFormDialog key={editingUser._id} user={editingUser} roles={roles} onClose={() => setDialog(null)} />}
    </AdminSection>
  );
};

const UserRow: React.FC<{ user: User; onSelect: () => void }> = ({ user, onSelect }) => {
  const isDisabled = user.status === 'disabled';
  return (
    <li>
      <button
        type="button"
        onClick={onSelect}
        className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-secondary/60"
      >
        <img
          src={getUserAvatarUrl(user.username, user.profilePicture, 64)}
          alt=""
          onError={(e) => handleAvatarError(e, user.username, 64)}
          className={cn('size-8 shrink-0 rounded-full border border-border object-cover', isDisabled && 'opacity-40 grayscale')}
        />
        <div className="min-w-0 grow">
          <div className="flex items-center gap-2">
            <span className={cn('truncate text-sm font-semibold', isDisabled ? 'text-muted-foreground line-through' : 'text-foreground')}>
              {user.username}
            </span>
            {user.discordId && <DiscordIcon className="shrink-0 text-[#5865F2]" aria-label="Discord linked" />}
          </div>
          {user.email && <p className="truncate text-xs text-muted-foreground">{user.email}</p>}
        </div>
        <div className="hidden flex-wrap justify-end gap-1 sm:flex">
          {user.roles.filter((r) => r !== 'user').map((r) => (
            <span key={r} className={cn('rounded-full px-2 py-0.5 text-[10px] font-medium capitalize', getRoleBadgeClasses(r, true))}>
              {r}
            </span>
          ))}
        </div>
        <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
      </button>
    </li>
  );
};

export default UserList;
