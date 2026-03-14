import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const clientId = process.env.GOOGLE_CLIENT_ID?.trim();
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim();

  if (!clientId || !clientSecret) {
    return NextResponse.json({ detail: 'Missing credentials' }, { status: 500 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ status: 'error', token: null, error: 'Invalid request body' });
  }

  const { device_code } = body;

  if (!device_code) {
    return NextResponse.json({ status: 'error', token: null, error: 'Missing device_code' });
  }

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      device_code: device_code,
      grant_type: 'urn:ietf:params:oauth:grant-type:device_code',
    }),
  });

  const data = await response.json();

  // User hasn't completed auth yet - keep polling
  if (data.error === 'authorization_pending' || data.error === 'slow_down') {
    return NextResponse.json({ status: 'pending', token: null, error: null });
  }

  // Specific error cases
  if (data.error === 'expired_token') {
    return NextResponse.json({ status: 'error', token: null, error: 'Code expired. Please try again.' });
  }

  if (data.error === 'access_denied') {
    return NextResponse.json({ status: 'error', token: null, error: 'Access denied by user.' });
  }

  if (data.error === 'unauthorized_client') {
    return NextResponse.json({
      status: 'error',
      token: null,
      error: 'OAuth client not configured for device flow. Check Google Cloud Console settings.'
    });
  }

  if (data.error) {
    return NextResponse.json({ status: 'error', token: null, error: data.error_description || data.error });
  }

  return NextResponse.json({
    status: 'complete',
    token: JSON.stringify(data),
    error: null,
  });
}
