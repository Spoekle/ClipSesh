import bcrypt from 'bcrypt';
import crypto from 'crypto';
import User from '@/models/userModel';

export async function createOrUpdateAdminUser(): Promise<void> {
  const adminUsername = process.env.ADMIN_USERNAME || 'admin';
  const backendUrl = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_BACKEND_URL || '';

  let adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword) {
    adminPassword = crypto.randomBytes(15).toString('hex').match(/.{1,5}/g)?.join('-') || 'admin-password';
    process.env.ADMIN_PASSWORD = adminPassword;
  }

  try {
    const existingAdmin = await User.findOne({ username: adminUsername });
    const hashedPassword = await bcrypt.hash(adminPassword, 10);

    if (!existingAdmin) {
      const adminUser = new User({
        username: adminUsername,
        password: hashedPassword,
        roles: ['admin', 'user'],
        status: 'active',
        profilePicture: `${backendUrl}/profilePictures/profile_placeholder.png`,
      });
      await adminUser.save();
      console.log(`[Admin Setup] Created initial admin user: ${adminUsername}`);
    } else {
      existingAdmin.password = hashedPassword;
      if (!existingAdmin.roles.includes('admin')) {
        existingAdmin.roles.push('admin');
      }
      existingAdmin.status = 'active';
      await existingAdmin.save();
      console.log(`[Admin Setup] Updated admin user: ${adminUsername}`);
    }

    console.log(`[Admin Setup] Username: ${adminUsername}`);
    console.log(`[Admin Setup] Password: ${adminPassword}`);
  } catch (error) {
    console.error('Error creating/updating admin user:', error);
  }
}

export default createOrUpdateAdminUser;
