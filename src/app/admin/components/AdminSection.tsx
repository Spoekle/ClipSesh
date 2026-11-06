import React from 'react';
import { cn } from '@/lib/utils';

interface AdminSectionProps {
  title: string;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}

/** Shared section shell for admin tabs: one title row, optional actions, then content. */
export const AdminSection: React.FC<AdminSectionProps> = ({
  title,
  description,
  actions,
  className,
  children,
}) => (
  <section className={cn('space-y-5', className)}>
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <h2 className="text-xl font-bold tracking-tight text-foreground">{title}</h2>
        {description && (
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </div>
    {children}
  </section>
);

export default AdminSection;
