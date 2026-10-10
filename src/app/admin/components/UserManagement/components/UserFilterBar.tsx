'use client';

import React from 'react';
import { FaSearch, FaTimes, FaCheck } from 'react-icons/fa';
import { getRoleBadgeClasses } from '../utils/roleBadgeHelper';

interface UserFilterBarProps {
  search: string;
  setSearch: (val: string) => void;
  statusFilter: 'all' | 'active' | 'disabled';
  setStatusFilter: (val: 'all' | 'active' | 'disabled') => void;
  roleFilter: string[];
  toggleRoleFilter: (role: string) => void;
  clearRoleFilter: () => void;
  allRoles: string[];
  totalUsersCount: number;
  activeCount: number;
  disabledCount: number;
  filteredCount: number;
}

export const UserFilterBar: React.FC<UserFilterBarProps> = ({
  search,
  setSearch,
  statusFilter,
  setStatusFilter,
  roleFilter,
  toggleRoleFilter,
  clearRoleFilter,
  allRoles,
  totalUsersCount,
  activeCount,
  disabledCount,
  filteredCount,
}) => {
  return (
    <div className="bg-cc-card border border-border p-4 rounded-xl space-y-3">
      {/* Search input */}
      <div className="relative">
        <input
          type="text"
          placeholder="Search by username, email, or Discord tag..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-10 py-2 bg-cc-ground border border-border rounded-xl text-xs text-foreground placeholder-muted-foreground/60 focus:outline-none focus:border-border/80 transition-colors"
        />
        <FaSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground text-xs" />
        {search && (
          <button
            type="button"
            onClick={() => setSearch('')}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
          >
            <FaTimes className="text-xs" />
          </button>
        )}
      </div>

      {/* Status Filter Tabs & Counter */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-2 border-t border-border">
        {/* Status pills */}
        <div className="flex items-center gap-1.5 p-1 bg-cc-ground rounded-xl border border-border">
          <button
            type="button"
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
              statusFilter === 'all'
                ? 'bg-white/10 text-foreground shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            All ({totalUsersCount})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('active')}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
              statusFilter === 'active'
                ? 'bg-emerald-500/20 text-emerald-400 shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Active ({activeCount})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('disabled')}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
              statusFilter === 'disabled'
                ? 'bg-primary/20 text-primary shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Disabled ({disabledCount})
          </button>
        </div>

        {/* Match Counter */}
        <span className="text-xs text-muted-foreground">
          Showing {filteredCount} users
        </span>
      </div>

      {/* Role Filter Chips */}
      <div className="flex flex-wrap items-center gap-1.5 pt-1">
        <span className="text-xs text-muted-foreground mr-1 font-medium">Role:</span>
        {allRoles.map((role) => {
          const isActive = roleFilter.includes(role);
          return (
            <button
              type="button"
              key={role}
              onClick={() => toggleRoleFilter(role)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium capitalize transition-all cursor-pointer flex items-center gap-1.5 ${getRoleBadgeClasses(
                role,
                isActive
              )}`}
            >
              {isActive && <FaCheck className="text-[10px]" />}
              {role}
            </button>
          );
        })}
        {roleFilter.length > 0 && (
          <button
            type="button"
            onClick={clearRoleFilter}
            className="px-2 py-1 rounded-lg text-xs text-muted-foreground hover:text-foreground bg-cc-ground border border-border transition-colors cursor-pointer"
          >
            Clear
          </button>
        )}
      </div>
    </div>
  );
};

export default UserFilterBar;
