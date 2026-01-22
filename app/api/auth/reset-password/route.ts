import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import User from '@/lib/models/User';
import bcryptjs from 'bcryptjs';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    const { token, password, confirm_password } = await request.json();

    if (!token || !password || !confirm_password) {
      return NextResponse.json({ error: 'Token and passwords are required' }, { status: 400 });
    }

    if (password !== confirm_password) {
      return NextResponse.json({ error: 'Passwords do not match' }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 });
    }

    // Hash the token to find the user
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      password_reset_token: tokenHash,
      password_reset_expires: { $gt: new Date() }
    });

    if (!user) {
      return NextResponse.json({ error: 'Invalid or expired reset token' }, { status: 400 });
    }

    // Hash new password
    const hashedPassword = await bcryptjs.hash(password, 10);

    // Update password and clear reset token
    user.password = hashedPassword;
    user.password_reset_token = undefined;
    user.password_reset_expires = undefined;
    await user.save();

    return NextResponse.json({ 
      message: 'Password reset successful. You can now sign in with your new password.' 
    }, { status: 200 });
  } catch (error: any) {
    console.error('[Reset Password API] Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
