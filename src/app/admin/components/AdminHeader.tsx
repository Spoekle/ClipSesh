'use client';

import React from 'react';
import Breadcrumbs from '@/components/common/Breadcrumbs';
import { routeCrumbs } from '@/lib/breadcrumbs';
import { RotateCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface AdminHeaderProps {
  seasonLabel: string;
  isConnected: boolean;
  onRefresh: () => void;
  loading: boolean;
  children?: React.ReactNode;
}

export const AdminHeader: React.FC<AdminHeaderProps> = ({
  seasonLabel,
  isConnected,
  onRefresh,
  loading,
  children,
}) => (
  <div className="relative w-full select-none">
    <div className="mx-auto max-w-[1200px] px-4 pt-6 pb-4 sm:px-8">
      <Breadcrumbs items={[{ label: routeCrumbs.admin.label }]} className="mb-2" />

      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <div className="relative w-fit pb-3">
            <h1 className="text-3xl leading-tight font-bold tracking-tight text-foreground uppercase sm:text-4xl md:text-5xl">
              Admin
            </h1>
            <div className="absolute bottom-0 left-0 h-[2.5px] w-3/5 rounded-full bg-primary" />
          </div>
          <p className="mt-3 flex items-center gap-2 text-sm text-muted-foreground sm:text-base">
            <span className="capitalize">{seasonLabel}</span>
            <span aria-hidden>·</span>
            <span className="inline-flex items-center gap-1.5">
              <span className={cn('size-1.5 rounded-full', isConnected ? 'bg-emerald-500' : 'bg-muted-foreground')} />
              {isConnected ? 'Live' : 'Offline'}
            </span>
          </p>
        </div>

        <Button variant="outline" size="sm" onClick={onRefresh} disabled={loading} className="gap-2 self-start sm:self-auto">
          <RotateCw className={cn('size-3.5', loading && 'animate-spin')} />
          Refresh
        </Button>
      </div>

      {children && <div className="mt-8">{children}</div>}
    </div>
  </div>
);

export default AdminHeader;
