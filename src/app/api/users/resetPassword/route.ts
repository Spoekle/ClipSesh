import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import User from '@/models/userModel';
import { signToken } from '@/lib/auth';
import nodemailer from 'nodemailer';

export async function POST(req: NextRequest) {
  try {
    await connectToDatabase();
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return NextResponse.json(
        { error: 'User not found or no email linked' },
        { status: 404 }
      );
    }

    const resetToken = signToken({ id: user._id }, '1h');
    const frontendUrl =
      process.env.FRONTEND_URL ||
      (req.headers.get('origin') ? req.headers.get('origin') : 'http://localhost:3000');
    const resetLink = `${frontendUrl}/resetpassword?token=${resetToken}`;

    const mailEmail = process.env.MAIL_EMAIL;
    const mailPassword = process.env.MAIL_PASSWORD;

    if (mailEmail && mailPassword) {
      const transporter = nodemailer.createTransport({
        host: 'smtp.mail.me.com',
        port: 587,
        secure: false,
        auth: {
          user: mailEmail,
          pass: mailPassword,
        },
        tls: {
          rejectUnauthorized: false,
        },
      });

      await transporter.sendMail({
        from: 'noreply@spoekle.com',
        to: email,
        subject: 'Reset Your ClipSesh Password',
        text: `Hi ${user.username},

You have requested to reset your password on ClipSesh. Please click the link below to set a new password:

${resetLink}

If you did not request this, please ignore this email.

- ClipSesh Team`,
      });
    } else {
      console.log(`[Reset Password Link]: ${resetLink}`);
    }

    return NextResponse.json({
      success: true,
      message: 'Password reset link sent to your email.',
    });
  } catch (error) {
    console.error('Error sending reset password email:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
