import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');

  if (code) {
    // Exchange the code for a session
    // The actual auth handling is done client-side by Supabase
    return NextResponse.redirect(`${requestUrl.origin}/`);
  }

  // If no code, redirect to home
  return NextResponse.redirect(requestUrl.origin);
}
