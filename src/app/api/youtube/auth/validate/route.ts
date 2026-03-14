import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ valid: false });
  }

  const { oauth_token } = body;

  if (!oauth_token) {
    return NextResponse.json({ valid: false });
  }

  // Parse the token JSON to get access_token
  let accessToken: string;
  try {
    const tokenData = JSON.parse(oauth_token);
    accessToken = tokenData.access_token;
    if (!accessToken) {
      return NextResponse.json({ valid: false });
    }
  } catch {
    return NextResponse.json({ valid: false });
  }

  // Make a lightweight API call to check token validity
  try {
    const response = await fetch(
      'https://www.googleapis.com/youtube/v3/channels?part=id&mine=true',
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    // 200 = valid, anything else = invalid/expired
    return NextResponse.json({ valid: response.status === 200 });
  } catch {
    return NextResponse.json({ valid: false });
  }
}
