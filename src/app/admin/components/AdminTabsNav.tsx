'use client';

import React from 'react';
import {
  FaChartBar,
  FaUsers,
  FaFilm,
  FaCog,
  FaFlag,
} from 'react-icons/fa';

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
    { id: 'overview', label: 'Overview', icon: <FaChartBar size={13} /> },
    { id: 'users', label: 'Users', icon: <FaUsers size={13} /> },
    { id: 'content', label: 'Content Management', icon: <FaFilm size={13} /> },
    { id: 'config', label: 'Configuration', icon: <FaCog size={13} /> },
    {
      id: 'reports',
      label: 'Reports',
      icon: <FaFlag size={13} />,
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
              ? 'bg-primary text-white shadow-sm'
              : 'text-muted-foreground hover:text-white bg-cc-card hover:bg-border/60 border border-border'
          }`}
        >
          {tab.icon}
          <span>{tab.label}</span>
          {tab.badge !== undefined && tab.badge > 0 && (
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                activeTab === tab.id ? 'bg-white/20 text-white' : 'bg-primary/20 text-primary'
              }`}
            >
              {tab.badge}
            </span>
          )}
        </button>
      ))}
    </div>
  );
};

export default AdminTabsNav;
