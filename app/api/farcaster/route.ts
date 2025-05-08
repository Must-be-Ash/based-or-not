import { NextRequest, NextResponse } from 'next/server';

const NEYNAR_API_KEY = process.env.NEYNAR_API_KEY || 'A79A75FD-4C65-43A8-B87B-9BB04FBDBA12';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const addresses = searchParams.get('addresses');

  if (!addresses) {
    return NextResponse.json({ error: 'No addresses provided' }, { status: 400 });
  }

  const options = {
    method: 'GET',
    headers: {
      'x-api-key': NEYNAR_API_KEY,
      'x-neynar-experimental': 'false'
    }
  };

  try {
    const response = await fetch(
      `https://api.neynar.com/v2/farcaster/user/bulk-by-address?addresses=${addresses}`,
      options
    );

    if (!response.ok) {
      throw new Error(`Neynar API error: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching Farcaster data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch Farcaster data' },
      { status: 500 }
    );
  }
} 