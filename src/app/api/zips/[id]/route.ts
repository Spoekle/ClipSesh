import path from 'path';
import fs from 'fs';
import { NextResponse } from 'next/server';
import { authRoute } from '@/lib/route';
import Zip from '@/models/zipModel';

export const GET = authRoute<{ id: string }>(['clipteam', 'editor', 'admin'], async (req, { params }) => {
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
});

export const DELETE = authRoute<{ id: string }>(['admin'], async (req, { params }) => {
  const { id } = await params;
  await Zip.findByIdAndDelete(id);

  return NextResponse.json({ message: 'Zip deleted successfully' });
});
