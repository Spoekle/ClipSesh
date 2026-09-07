import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Report from '@/models/reportModel';
import Notification from '@/models/notificationModel';
import { requireAuth } from '@/lib/auth';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase();
    const { errorResponse } = requireAuth(req, ['admin']);
    if (errorResponse) return errorResponse;

    const { id } = await params;
    const report = await Report.findById(id);
    if (!report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }
    return NextResponse.json(report);
  } catch (error: any) {
    console.error('Error fetching report:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase();
    const { user: authUser, errorResponse } = requireAuth(req, ['admin']);
    if (errorResponse) return errorResponse;

    const { id } = await params;
    const { status, adminNotes } = await req.json();
    const reviewerUsername = authUser!.username;

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
          senderId: authUser!.id,
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
  } catch (error: any) {
    console.error('Error updating report:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase();
    const { errorResponse } = requireAuth(req, ['admin']);
    if (errorResponse) return errorResponse;

    const { id } = await params;
    const deletedReport = await Report.findByIdAndDelete(id);

    if (!deletedReport) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Report deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting report:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
