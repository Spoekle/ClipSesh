'use client';

import React from 'react';
import Link from 'next/link';
import { FaSyncAlt } from 'react-icons/fa';

interface AdminHeaderProps {
  isConnected: boolean;
  userCount: number;
  clipCount: number;
  onRefresh: () => void;
  loading: boolean;
}

export const AdminHeader: React.FC<AdminHeaderProps> = ({
  isConnected,
  userCount,
  clipCount,
  onRefresh,
  loading,
}) => {
  return (
    <div className="relative w-full overflow-hidden select-none">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-8 pt-6 pb-4">
        {/* Breadcrumbs */}
        <nav className="flex items-center gap-1.5 text-sm text-muted-foreground mb-2">
          <Link href="/" className="hover:text-white transition-colors">
            Home
          </Link>
          <span className="text-muted-foreground/60 select-none">/</span>
          <span className="text-white font-medium">Admin Dashboard</span>
        </nav>

        {/* Title row with signature CC Red Underline */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="relative pb-3 w-fit">
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white tracking-tight leading-tight uppercase">
                ADMIN DASHBOARD
              </h1>
              <div className="absolute bottom-0 left-0 w-3/5 h-[2.5px] bg-primary rounded-full" />
            </div>
            <p className="mt-3 text-sm sm:text-base text-muted-foreground leading-relaxed max-w-xl">
              System administration, clip pipeline management, user authorization, and statistics.
            </p>
          </div>

          {/* Quick status & refresh */}
          <div className="flex items-center gap-3 pb-1">
            <button
              onClick={onRefresh}
              disabled={loading}
              className="flex items-center gap-2 px-3 py-2 rounded-md bg-cc-card border border-border text-muted-foreground hover:text-white hover:bg-border/60 transition-colors cursor-pointer disabled:opacity-50"
              title="Refresh all admin data"
            >
              <FaSyncAlt size={13} className={loading ? 'animate-spin' : ''} />
              <span className='hidden sm:block text-xs font-semibold'>Refresh</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminHeader;
