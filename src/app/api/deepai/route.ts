import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { photoUrl, style } = await request.json();

    if (!photoUrl || !style) {
      return NextResponse.json(
        { error: 'Missing photoUrl or style' },
        { status: 400 }
      );
    }

    const apiKey = process.env.DEEPAI_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json(
        { error: 'DeepAI API key not configured' },
        { status: 500 }
      );
    }

    const formData = new FormData();
    formData.append('content', photoUrl);
    formData.append('style', style);

    const response = await fetch('https://api.deepai.org/api/fast-style-transfer', {
      method: 'POST',
      headers: {
        'api-key': apiKey,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('DeepAI API error:', errorText);
      return NextResponse.json(
        { error: `DeepAI API error: ${response.status}` },
        { status: response.status }
      );
    }

    const result = await response.json();
    
    if (result.output_url) {
      return NextResponse.json({ artisticUrl: result.output_url });
    } else {
      return NextResponse.json(
        { error: 'No output URL from DeepAI' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('DeepAI API route error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
