'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export const ADMIN_TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'seasons', label: 'Seasons' },
  { id: 'denied', label: 'Denied' },
  { id: 'scraper', label: 'Scraper' },
  { id: 'users', label: 'Users' },
  { id: 'reports', label: 'Reports' },
  { id: 'settings', label: 'Settings' },
] as const;

export type AdminTab = (typeof ADMIN_TABS)[number]['id'];

const LEGACY_TABS: Record<string, AdminTab> = { content: 'seasons', config: 'settings' };

/**
 * Resolves a `?tab=` query value to a known admin tab, mapping old tab names.
 *
 * @example
 * parseAdminTab('config'); // 'settings'
 * parseAdminTab('nope');   // 'overview'
 */
export function parseAdminTab(value: string | null): AdminTab {
  if (!value) return 'overview';
  const match = ADMIN_TABS.find((tab) => tab.id === value);
  return match?.id ?? LEGACY_TABS[value] ?? 'overview';
}

interface AdminTabsNavProps {
  activeTab: AdminTab;
  onTabChange: (tab: AdminTab) => void;
  badges: Partial<Record<AdminTab, number>>;
}

export const AdminTabsNav: React.FC<AdminTabsNavProps> = ({ activeTab, onTabChange, badges }) => (
  <nav className="no-scrollbar flex w-fit max-w-full items-center gap-1 overflow-x-auto rounded-full border border-border bg-card p-1">
    {ADMIN_TABS.map((tab) => {
      const isActive = activeTab === tab.id;
      const badge = badges[tab.id] ?? 0;
      return (
        <button
          key={tab.id}
          type="button"
          onClick={() => onTabChange(tab.id)}
          aria-pressed={isActive}
          className={cn(
            'flex shrink-0 items-center gap-1.5 rounded-full px-4 py-1.5 text-xs font-semibold transition-colors',
            isActive
              ? 'bg-foreground text-background shadow-sm'
              : 'text-muted-foreground hover:bg-secondary hover:text-foreground',
          )}
        >
          {tab.label}
          {badge > 0 && (
            <span className="rounded-full bg-primary px-1.5 text-[10px] leading-4 font-bold text-primary-foreground tabular-nums">
              {badge}
            </span>
          )}
        </button>
      );
    })}
  </nav>
);

export default AdminTabsNav;
