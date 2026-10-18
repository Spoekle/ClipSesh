import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import User from '@/models/userModel';
import { signToken } from '@/lib/auth';
import nodemailer from 'nodemailer';
import {
  generateResetPasswordEmailHtml,
  generateResetPasswordEmailText,
} from '@/lib/emailTemplates';

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
      req.headers.get('origin') ||
      (req.headers.get('host') ? `${req.headers.get('x-forwarded-proto') || 'http'}://${req.headers.get('host')}` : '');
    const resetLink = `${frontendUrl}/reset-password?token=${resetToken}`;

    const mailEmail = process.env.MAIL_EMAIL;
    const mailPassword = process.env.MAIL_PASSWORD;
    const mailHost = process.env.MAIL_HOST;
    const mailPort = process.env.MAIL_PORT;
    const mailFrom = process.env.MAIL_FROM;

    if (mailEmail && mailPassword && mailHost && mailPort && mailFrom) {
      const transporter = nodemailer.createTransport({
        host: mailHost,
        port: parseInt(mailPort),
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
        from: `"ClipSesh" <${mailFrom}>`,
        to: email,
        subject: 'Reset Your ClipSesh Password',
        text: generateResetPasswordEmailText({
          username: user.username,
          resetLink,
        }),
        html: generateResetPasswordEmailHtml({
          username: user.username,
          resetLink,
          frontendUrl,
        }),
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
