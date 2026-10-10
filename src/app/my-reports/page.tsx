'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { FaFlag } from 'react-icons/fa';
import { useUserReports } from '@/hooks/useReports';
import { Report } from '@/types/adminTypes';
import UserReportMessagingModal from './components/UserReportMessagingModal';
import ReportCard from './components/ReportCard';
import RequireAuth from '@/components/RequireAuth';

function UserReportsPage() {
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [showMessagingModal, setShowMessagingModal] = useState<boolean>(false);

  const { data: reports = [], isLoading } = useUserReports();

  const openMessaging = (report: Report) => {
    setSelectedReport(report);
    setShowMessagingModal(true);
  };

  const closeMessaging = () => {
    setShowMessagingModal(false);
    setSelectedReport(null);
  };

  if (isLoading) {
    return (
      <div className="min-h-[calc(100vh-80px)] bg-cc-ground text-cc-text py-16 flex flex-col justify-center items-center">
        <div className="w-8 h-8 border-2 border-border border-t-primary rounded-full animate-spin" />
        <span className="mt-3 text-xs text-muted-foreground font-medium">
          Loading your reports...
        </span>
      </div>
    );
  }

  return (
    <div className="relative min-h-[calc(100vh-80px)] bg-cc-ground text-cc-text">
      {/* CC Page Header Container (1200px centered) */}
      <div className="relative w-full overflow-hidden select-none">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-8 pt-6 pb-4">
          {/* Breadcrumbs */}
          <nav className="flex items-center gap-1.5 text-sm text-muted-foreground mb-2">
            <Link href="/" className="hover:text-white transition-colors">
              Home
            </Link>
            <span className="text-muted-foreground/60 select-none">/</span>
            <span className="text-white font-medium">My Reports</span>
          </nav>

          {/* Title row with signature CC Red Underline */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <div className="relative pb-3 w-fit">
                <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white tracking-tight leading-tight uppercase">
                  MY REPORTS
                </h1>
                <div className="absolute bottom-0 left-0 w-3/5 h-[2.5px] bg-primary rounded-full" />
              </div>
              <p className="mt-3 text-sm sm:text-base text-muted-foreground leading-relaxed max-w-xl">
                View status updates, admin notes, and discuss your submitted clip reports.
              </p>
            </div>

            {/* Badges */}
            <div className="flex items-center gap-2.5 pb-1">
              <span className="text-xs font-semibold px-2.5 py-1 rounded-[6px] bg-cc-card border border-border text-cc-text">
                Reports Console
              </span>
              <span className="text-xs font-medium px-3 py-1 rounded-sm bg-primary/10 border border-primary/25 text-primary">
                {reports.length} {reports.length === 1 ? 'report' : 'reports'} submitted
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[1200px] mx-auto px-4 sm:px-8 py-6">
        {/* Reports List */}
        {reports.length === 0 ? (
          <div className="text-center py-16 bg-cc-card rounded-2xl border border-border shadow-sm">
            <div className="w-12 h-12 bg-cc-ground border border-border rounded-xl flex items-center justify-center mx-auto mb-3 text-muted-foreground">
              <FaFlag size={18} />
            </div>
            <h3 className="text-sm font-bold text-cc-text mb-1">
              No reports submitted
            </h3>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              You haven't submitted any clip reports yet. If you spot a clip violating guidelines, you can report it from the clip viewer.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {reports.map((report) => (
              <ReportCard
                key={report._id}
                report={report}
                onOpenMessaging={openMessaging}
              />
            ))}
          </div>
        )}

        {/* User Report Messaging Modal */}
        <UserReportMessagingModal
          report={selectedReport}
          isOpen={showMessagingModal}
          onClose={closeMessaging}
        />
      </div>
    </div>
  );
}

export default function MyReportsPage() {
  return (
    <RequireAuth>
      <UserReportsPage />
    </RequireAuth>
  );
}