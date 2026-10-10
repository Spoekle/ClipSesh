'use client';

import React from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';

export interface BreadcrumbItem {
  label: string;
  path?: string;
}

interface PageLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  breadcrumbs?: BreadcrumbItem[];
  backgroundImage?: string | { src?: string } | null;
  metaDescription?: string;
  headerRight?: React.ReactNode;
  noMaxWidth?: boolean;
  contentAnimationDelay?: number;
}

const PageLayout: React.FC<PageLayoutProps> = ({
  children,
  title,
  subtitle,
  breadcrumbs,
  backgroundImage,
  metaDescription,
  headerRight,
  noMaxWidth = false,
  contentAnimationDelay = 0,
}) => {
  const bgUrl =
    typeof backgroundImage === 'object' && backgroundImage !== null
      ? backgroundImage.src || ''
      : typeof backgroundImage === 'string'
      ? backgroundImage
      : '';

  const defaultBreadcrumbs: BreadcrumbItem[] = [
    { label: 'Home', path: '/' },
    { label: title },
  ];

  const activeBreadcrumbs = breadcrumbs && breadcrumbs.length > 0 ? breadcrumbs : defaultBreadcrumbs;

  return (
    <div className="relative min-h-[calc(100vh-80px)] flex flex-col bg-background text-foreground transition-colors">
      <title>{`${title} • ClipSesh`}</title>
      {metaDescription && <meta name="description" content={metaDescription} />}

      {/* Ambient background image layer */}
      {bgUrl && (
        <div className="absolute top-0 left-0 w-full h-95 overflow-hidden pointer-events-none -z-10 select-none">
          <div
            className="w-full h-full bg-cover bg-center filter blur-[6px] opacity-30 transform scale-105"
            style={{
              backgroundImage: `url(${bgUrl})`,
              maskImage: 'linear-gradient(180deg, rgba(0,0,0,1) 0%, rgba(15,15,15,0) 100%)',
              WebkitMaskImage: 'linear-gradient(180deg, rgba(0,0,0,1) 0%, rgba(15,15,15,0) 100%)',
            }}
          />
          <div className="absolute inset-0 bg-linear-to-b from-transparent via-background/60 to-background" />
        </div>
      )}

      {/* Standard Content Wrapper (1200px centered) */}
      <div
        className={`w-full mx-auto px-4 sm:px-8 py-6 md:py-8 flex flex-col grow ${
          noMaxWidth ? 'max-w-full' : 'max-w-[1200px]'
        }`}
      >
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8 pb-4">
          <div className="left flex flex-col">
            {/* Breadcrumbs */}
            {activeBreadcrumbs.length > 1 && (
              <nav className="flex items-center flex-wrap gap-1.5 text-sm text-muted-foreground mb-2">
                {activeBreadcrumbs.map((crumb, index) => {
                  const isLast = index === activeBreadcrumbs.length - 1;
                  return (
                    <React.Fragment key={crumb.path || crumb.label + index}>
                      {crumb.path && !isLast ? (
                        <Link
                          href={crumb.path}
                          className="hover:text-foreground transition-colors"
                        >
                          {crumb.label}
                        </Link>
                      ) : (
                        <span className={isLast ? 'text-foreground font-medium' : 'text-muted-foreground'}>
                          {crumb.label}
                        </span>
                      )}
                      {!isLast && <span className="text-muted-foreground/60 select-none">/</span>}
                    </React.Fragment>
                  );
                })}
              </nav>
            )}

            {/* Signature Page Title with Red Underline */}
            <div className="relative pb-3 w-fit">
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground tracking-tight leading-tight uppercase">
                {title}
              </h1>
              {/* CC Signature red bar */}
              <div className="absolute bottom-0 left-0 w-3/5 h-[2.5px] bg-cc-red rounded-full" />
            </div>

            {/* Subtitle if present */}
            {subtitle && (
              <p className="mt-3 text-sm sm:text-base text-muted-foreground max-w-2xl leading-relaxed">
                {subtitle}
              </p>
            )}
          </div>

          {/* Right Header Area */}
          {headerRight && (
            <div className="right flex items-center gap-3 shrink-0">
              {headerRight}
            </div>
          )}
        </div>

        {/* Page Content Slot */}
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: contentAnimationDelay, duration: 0.15 }}
          className="page-content grow flex flex-col"
        >
          {children}
        </motion.div>
      </div>
    </div>
  );
};

export default PageLayout;
