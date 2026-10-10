import path from 'path';
import fs from 'fs';
import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Zip from '@/models/zipModel';
import { requireAuth } from '@/lib/auth';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectToDatabase();
    const { errorResponse } = requireAuth(req, ['clipteam', 'editor', 'admin']);
    if (errorResponse) return errorResponse;

    const { id } = await params;
    const zip = await Zip.findById(id).lean();
    if (!zip) {
      return NextResponse.json({ error: 'Zip not found' }, { status: 404 });
    }

    const downloadDir = path.join(process.cwd(), 'download');
    const zipPath = path.join(downloadDir, zip.name);

    if (!fs.existsSync(zipPath)) {
      return NextResponse.json({ error: 'File not found on server' }, { status: 404 });
    }

    const stat = fs.statSync(zipPath);
    const fileStream = fs.createReadStream(zipPath);

    return new NextResponse(fileStream as any, {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Length': stat.size.toString(),
        'Content-Disposition': `attachment; filename="${zip.name}"`,
      },
    });
  } catch (error: any) {
    console.error('Error downloading zip:', error);
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
    await Zip.findByIdAndDelete(id);

    return NextResponse.json({ message: 'Zip deleted successfully' });
  } catch (error: any) {
    console.error('Error deleting zip:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
