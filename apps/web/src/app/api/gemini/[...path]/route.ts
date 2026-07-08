import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

export async function POST(req: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  try {
    const resolvedParams = await params;
    const path = resolvedParams.path.join('/');
    const searchParams = req.nextUrl.searchParams.toString();
    const url = `https://generativelanguage.googleapis.com/${path}${searchParams ? `?${searchParams}` : ''}`;

    const reqBody = await req.json();

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    if (req.headers.has('x-goog-api-key')) {
      headers['x-goog-api-key'] = req.headers.get('x-goog-api-key') as string;
    }
    if (req.headers.has('x-goog-api-client')) {
      headers['x-goog-api-client'] = req.headers.get('x-goog-api-client') as string;
    }

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(reqBody),
    });

    const data = await response.json();
    
    return NextResponse.json(data, { status: response.status });
  } catch (error: any) {
    console.error("Gemini Proxy Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
