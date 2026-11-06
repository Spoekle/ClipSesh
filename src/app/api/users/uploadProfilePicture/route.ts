import { NextResponse } from 'next/server';
import { authRoute, ANY_ROLE } from '@/lib/route';
import path from 'path';
import fs from 'fs';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { users } from '@/db/schema';

const MAX_SIZE = 5 * 1024 * 1024; // 5MB limit
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

export const POST = authRoute(ANY_ROLE, async (req, { user: authUser }) => {
  const formData = await req.formData();
  const upload = formData.get('profilePicture');
  const file = upload instanceof File ? upload : null;

  if (!file) {
    return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
  }

  if (file.size > MAX_SIZE) {
    return NextResponse.json(
      { error: 'File size exceeds the 5MB limit' },
      { status: 400 }
    );
  }

  if (!file.type.startsWith('image/') || !ALLOWED_MIME_TYPES.includes(file.type)) {
    return NextResponse.json(
      { error: 'Only image files (JPEG, PNG, WEBP, GIF) are allowed' },
      { status: 400 }
    );
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const profilePicturesDir = path.join(process.cwd(), 'profilePictures');
  await fs.promises.mkdir(profilePicturesDir, { recursive: true });

  const timestamp = Date.now();
  const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
  const filename = `${timestamp}-${sanitizedName}`;
  const filePath = path.join(profilePicturesDir, filename);

  await fs.promises.writeFile(filePath, buffer);

  const profilePictureUrl = `/profilePictures/${filename}`;
  const [user] = await db
    .select({ profilePicture: users.profilePicture })
    .from(users)
    .where(eq(users._id, authUser.id));
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  if (user.profilePicture && !user.profilePicture.includes('profile_placeholder.png')) {
    const oldPicPath = path.join(profilePicturesDir, path.basename(user.profilePicture));
    try {
      await fs.promises.unlink(oldPicPath);
    } catch {}
  }

  await db.update(users).set({ profilePicture: profilePictureUrl }).where(eq(users._id, authUser.id));

  return NextResponse.json({ success: true, profilePictureUrl });
});
