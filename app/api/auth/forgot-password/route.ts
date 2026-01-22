import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/lib/models/User';
import { sendEmail } from '@/lib/email';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      // Don't reveal if email exists for security
      return NextResponse.json({ 
        message: 'If an account exists with this email, you will receive a password reset link.' 
      }, { status: 200 });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');
    const resetTokenExpiry = new Date(Date.now() + 1 * 60 * 60 * 1000); // 1 hour

    // Update user with reset token
    user.password_reset_token = resetTokenHash;
    user.password_reset_expires = resetTokenExpiry;
    await user.save();

    // Send email with reset link
    const resetLink = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;
    
    const emailHTML = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Password Reset Request</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; text-align: center; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; border: 1px solid #e0e0e0; }
            .button { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 12px 30px; text-decoration: none; border-radius: 4px; margin: 20px 0; font-weight: bold; }
            .footer { color: #999; font-size: 12px; margin-top: 20px; text-align: center; }
            .warning { color: #d32f2f; font-size: 12px; margin-top: 10px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Password Reset Request</h1>
            </div>
            <div class="content">
              <p>Hello ${user.full_name || 'User'},</p>
              <p>We received a request to reset your password. Click the button below to reset it:</p>
              <a href="${resetLink}" class="button">Reset Password</a>
              <p>Or copy and paste this link in your browser:</p>
              <p style="word-break: break-all; background: #f0f0f0; padding: 10px; border-radius: 4px; font-size: 12px;">${resetLink}</p>
              <div class="warning">
                <p><strong>⚠️ This link will expire in 1 hour.</strong></p>
                <p>If you didn't request this password reset, please ignore this email. Your password will not be changed.</p>
              </div>
              <p>Best regards,<br>Beyond Realms Team</p>
            </div>
            <div class="footer">
              <p>&copy; 2026 Beyond Realms. All rights reserved.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    await sendEmail(
      user.email,
      'Reset Your Password',
      emailHTML
    );

    return NextResponse.json({ 
      message: 'If an account exists with this email, you will receive a password reset link.' 
    }, { status: 200 });
  } catch (error: any) {
    console.error('[Forgot Password API] Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
