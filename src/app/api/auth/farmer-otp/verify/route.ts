import { NextRequest, NextResponse } from 'next/server';
import { verifyOtp } from '@/lib/farmer-otp';
import { signSession } from '@/lib/auth';

const FARMER_SESSION_TTL_MS = 365 * 24 * 60 * 60 * 1000; // 1 Year (365 days) persistent session

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const phone: string = (body.phone || '').replace(/\D/g, '').trim();
    const otp: string = (body.otp || '').trim();

    if (!phone || phone.length < 10) {
      return NextResponse.json(
        { success: false, error: 'Invalid phone number.' },
        { status: 400 }
      );
    }

    if (!otp || otp.length !== 6) {
      return NextResponse.json(
        { success: false, error: 'Please enter the 6-digit OTP.' },
        { status: 400 }
      );
    }

    // Verify OTP (checks in-memory and Supabase cloud)
    const result = await verifyOtp(phone, otp);
    if (!result.valid || !result.farmerId) {
      return NextResponse.json(
        { success: false, error: result.error || 'Invalid OTP.' },
        { status: 401 }
      );
    }

    // Sign a farmer session token
    const token = await signSession({
      email: `farmer:${phone}`,
      name: result.farmerId,
      role: 'farmer',
      exp: Date.now() + FARMER_SESSION_TTL_MS,
    });

    const response = NextResponse.json({
      success: true,
      farmerId: result.farmerId,
      message: 'OTP verified. Redirecting to your catalog...',
    });

    // Set farmer session cookie (separate from admin session)
    response.cookies.set('3t_farmer_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: FARMER_SESSION_TTL_MS / 1000,
      path: '/',
    });

    return response;
  } catch (error: any) {
    console.error('[farmer-otp/verify] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Server error. Please try again.' },
      { status: 500 }
    );
  }
}
