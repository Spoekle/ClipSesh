'use client';

import React from 'react';
import { FaFilter } from 'react-icons/fa';

export type NotificationCategory = 'all' | 'personal' | 'team' | 'ratings';

interface NotificationFiltersProps {
  activeCategory: NotificationCategory;
  setActiveCategory: (cat: NotificationCategory) => void;
  unreadOnly: boolean;
  setUnreadOnly: (unread: boolean) => void;
  counts: {
    all: number;
    unread: number;
    personal: number;
    team: number;
    ratings: number;
  };
}

export const NotificationFilters: React.FC<NotificationFiltersProps> = ({
  activeCategory,
  setActiveCategory,
  unreadOnly,
  setUnreadOnly,
  counts,
}) => {
  const categories: { id: NotificationCategory; label: string; count: number }[] = [
    { id: 'all', label: 'All', count: counts.all },
    { id: 'personal', label: 'Replies & Mentions', count: counts.personal },
    { id: 'team', label: 'Team Chat', count: counts.team },
    { id: 'ratings', label: 'Ratings & Reports', count: counts.ratings },
  ];

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
      {/* Category Pills */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeCategory === cat.id
                ? 'bg-primary text-white shadow-xs'
                : 'text-muted-foreground hover:text-white bg-cc-card hover:bg-border/60 border border-border'
            }`}
          >
            <span>{cat.label}</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                activeCategory === cat.id ? 'bg-white/20' : 'bg-cc-ground text-muted-foreground'
              }`}
            >
              {cat.count}
            </span>
          </button>
        ))}
      </div>

      {/* Unread Toggle */}
      <button
        onClick={() => setUnreadOnly(!unreadOnly)}
        className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer border self-start sm:self-auto ${
          unreadOnly
            ? 'bg-primary/20 text-primary border-primary/40'
            : 'text-muted-foreground hover:text-white bg-cc-card border-border hover:bg-border/60'
        }`}
      >
        <FaFilter size={10} />
        <span>Unread Only</span>
        {counts.unread > 0 && (
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-primary/20 text-primary">
            {counts.unread}
          </span>
        )}
      </button>
    </div>
  );
};

export default NotificationFilters;
