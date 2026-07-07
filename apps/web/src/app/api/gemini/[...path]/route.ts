import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest, { params }: { params: { path: string[] } }) {
  try {
    const path = params.path.join('/');
    const searchParams = req.nextUrl.searchParams.toString();
    const url = `https://generativelanguage.googleapis.com/${path}${searchParams ? `?${searchParams}` : ''}`;

    const reqBody = await req.json();

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(reqBody),
    });

    const data = await response.json();
    
    return NextResponse.json(data, { status: response.status });
  } catch (error: any) {
    console.error("Gemini Proxy Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
