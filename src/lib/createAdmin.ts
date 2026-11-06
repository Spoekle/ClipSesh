import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { users } from '@/db/schema';

export async function createOrUpdateAdminUser(): Promise<void> {
  const adminUsername = process.env.ADMIN_USERNAME || 'admin';

  let adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword) {
    adminPassword = crypto.randomBytes(15).toString('hex').match(/.{1,5}/g)?.join('-') || 'admin-password';
    process.env.ADMIN_PASSWORD = adminPassword;
  }

  try {
    const [existingAdmin] = await db
      .select({ roles: users.roles })
      .from(users)
      .where(eq(users.username, adminUsername));
    const hashedPassword = await bcrypt.hash(adminPassword, 10);

    if (!existingAdmin) {
      await db.insert(users).values({
        username: adminUsername,
        password: hashedPassword,
        roles: ['admin', 'user'],
        status: 'active',
        profilePicture: '/profilePictures/profile_placeholder.png',
      });
      console.log(`[Admin Setup] Created initial admin user: ${adminUsername}`);
    } else {
      await db
        .update(users)
        .set({
          password: hashedPassword,
          roles: existingAdmin.roles.includes('admin')
            ? existingAdmin.roles
            : [...existingAdmin.roles, 'admin'],
          status: 'active',
        })
        .where(eq(users.username, adminUsername));
      console.log(`[Admin Setup] Updated admin user: ${adminUsername}`);
    }

    console.log(`[Admin Setup] Username: ${adminUsername}`);
    console.log(`[Admin Setup] Password: ${adminPassword}`);
  } catch (error) {
    console.error('Error creating/updating admin user:', error);
  }
}

export default createOrUpdateAdminUser;
