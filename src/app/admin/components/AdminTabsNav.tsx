'use client';

import React from 'react';
import {
  BarChart3,
  Users,
  Film,
  Settings,
  Flag,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export type AdminTab = 'overview' | 'users' | 'content' | 'config' | 'reports';

interface AdminTabsNavProps {
  activeTab: AdminTab;
  onTabChange: (tab: AdminTab) => void;
  pendingReportsCount: number;
}

export const AdminTabsNav: React.FC<AdminTabsNavProps> = ({
  activeTab,
  onTabChange,
  pendingReportsCount,
}) => {
  const tabs: { id: AdminTab; label: string; icon: React.ReactNode; badge?: number }[] = [
    { id: 'overview', label: 'Overview', icon: <BarChart3 className="size-3.5" /> },
    { id: 'users', label: 'Users', icon: <Users className="size-3.5" /> },
    { id: 'content', label: 'Content Management', icon: <Film className="size-3.5" /> },
    { id: 'config', label: 'Configuration', icon: <Settings className="size-3.5" /> },
    {
      id: 'reports',
      label: 'Reports',
      icon: <Flag className="size-3.5" />,
      badge: pendingReportsCount,
    },
  ];

  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-border mb-6">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
            activeTab === tab.id
              ? 'bg-primary text-primary-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground bg-card hover:bg-secondary border border-border'
          }`}
        >
          {tab.icon}
          <span>{tab.label}</span>
          {tab.badge !== undefined && tab.badge > 0 && (
            <Badge
              variant={activeTab === tab.id ? 'secondary' : 'default'}
              className="text-[10px] font-bold px-1.5 py-0 h-4 rounded-full"
            >
              {tab.badge}
            </Badge>
          )}
        </button>
      ))}
    </div>
  );
};

export default AdminTabsNav;
