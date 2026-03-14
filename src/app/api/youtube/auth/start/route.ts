import { NextResponse } from 'next/server';

export async function POST() {
  // For local dev, call Python directly via subprocess or return mock
  // For production, Vercel handles Python routing
  
  const clientId = process.env.GOOGLE_CLIENT_ID?.trim();
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim();
  
  if (!clientId || !clientSecret) {
    return NextResponse.json(
      { detail: 'Missing Google OAuth credentials' },
      { status: 500 }
    );
  }

  try {
    const response = await fetch('https://oauth2.googleapis.com/device/code', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: clientId,
        scope: 'https://www.googleapis.com/auth/youtube https://www.googleapis.com/auth/youtube.readonly',
      }),
    });

    const data = await response.json();

    return NextResponse.json({
      device_code: data.device_code,
      user_code: data.user_code,
      verification_url: data.verification_url,
      expires_in: data.expires_in,
      interval: data.interval,
    });
  } catch {
    return NextResponse.json(
      { detail: 'Failed to start auth' },
      { status: 500 }
    );
  }
}
