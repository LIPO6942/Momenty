import { NextResponse } from 'next/server';

export async function POST(request: Request) {
    try {
        const apiKey = process.env.MOMENTY_API_KEY;

        if (!apiKey) {
            console.error('[Sync Kol Youm] MOMENTY_API_KEY is not set in environment variables');
            return NextResponse.json(
                { success: false, error: 'Server configuration error' },
                { status: 500 }
            );
        }

        const body = await request.json();
        const { userEmail, placeName, category, cityName, dishName, date } = body;

        // Validation
        if (!userEmail || !placeName || !cityName || !dishName) {
            return NextResponse.json(
                { success: false, error: 'Missing required fields' },
                { status: 400 }
            );
        }

        console.log(`[Sync Kol Youm] Syncing dish "${dishName}" for ${userEmail} at ${placeName}`);

        const response = await fetch('https://kol-youm-app.vercel.app/api/external-visit', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-API-Key': apiKey,
            },
            body: JSON.stringify({
                userEmail,
                placeName,
                category: category || 'restaurants',
                cityName,
                dishName,
                date: date || Date.now(),
            }),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error('[Sync Kol Youm] Kol Youm API returned error:', response.status, errorData);
            return NextResponse.json(
                { success: false, error: `Kol Youm API error: ${response.status}`, details: errorData },
                { status: response.status }
            );
        }

        const result = await response.json();
        console.log('[Sync Kol Youm] Sync successful:', result);

        return NextResponse.json({
            success: true,
            message: 'Successfully synced with Kol Youm',
            data: result,
        });
    } catch (error) {
        console.error('[Sync Kol Youm] Unexpected error:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}
