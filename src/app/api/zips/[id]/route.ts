import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import Zip from '@/models/zipModel';
import { requireAuth } from '@/lib/auth';

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
