import { NextResponse } from 'next/server';
import { authRoute } from '@/lib/route';
import Report from '@/models/reportModel';
import Notification from '@/models/notificationModel';

export const GET = authRoute<{ id: string }>(['admin'], async (req, { params }) => {
  const { id } = await params;
  const report = await Report.findById(id);
  if (!report) {
    return NextResponse.json({ error: 'Report not found' }, { status: 404 });
  }
  return NextResponse.json(report);
});

export const PATCH = authRoute<{ id: string }>(['admin'], async (req, { params, user: authUser }) => {
  const { id } = await params;
  const { status, adminNotes } = await req.json();
  const reviewerUsername = authUser.username;

  const currentReport = await Report.findById(id);
  if (!currentReport) {
    return NextResponse.json({ error: 'Report not found' }, { status: 404 });
  }

  const previousStatus = currentReport.status;
  const updateData: Record<string, any> = {};

  if (status) {
    updateData.status = status;
    if (status !== 'pending') {
      updateData.reviewedBy = reviewerUsername;
      updateData.reviewedAt = new Date();
    } else {
      updateData.reviewedBy = null;
      updateData.reviewedAt = null;
    }
  }

  if (adminNotes !== undefined) {
    updateData.adminNotes = adminNotes;
  }

  const updatedReport = await Report.findByIdAndUpdate(id, updateData, { new: true });
  if (!updatedReport) {
    return NextResponse.json({ error: 'Report not found' }, { status: 404 });
  }

  if (
    status &&
    status !== previousStatus &&
    (status === 'resolved' || status === 'dismissed')
  ) {
    try {
      const notification = new Notification({
        recipientId: updatedReport.reporterId,
        senderId: authUser.id,
        senderUsername: reviewerUsername,
        type: 'report',
        entityId: id,
        clipId: updatedReport.clipId,
        message: `Your report on "${updatedReport.clipTitle}" has been ${status}`,
        read: false,
      });
      await notification.save();
    } catch (notifErr) {
      console.error('Error creating report notification:', notifErr);
    }
  }

  return NextResponse.json(updatedReport);
});

export const DELETE = authRoute<{ id: string }>(['admin'], async (req, { params }) => {
  const { id } = await params;
  const deletedReport = await Report.findByIdAndDelete(id);

  if (!deletedReport) {
    return NextResponse.json({ error: 'Report not found' }, { status: 404 });
  }

  return NextResponse.json({ message: 'Report deleted successfully' });
});
