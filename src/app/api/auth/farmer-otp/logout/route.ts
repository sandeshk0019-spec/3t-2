import { NextResponse } from 'next/server';

export async function POST() {
  const response = NextResponse.json({ success: true, message: 'Farmer logged out' });
  response.cookies.set('3t_farmer_token', '', {
    httpOnly: true,
    expires: new Date(0),
    path: '/'
  });
  return response;
}
