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
        const cleanEmail = userEmail?.trim().toLowerCase();

        // Validation
        if (!cleanEmail || !placeName || !cityName || !dishName) {
            console.error('[Sync Kol Youm] Validation failed:', { cleanEmail, placeName, cityName, dishName });
            return NextResponse.json(
                { success: false, error: 'Missing required fields' },
                { status: 400 }
            );
        }

        const payload = {
            userEmail: cleanEmail,
            placeName,
            category: category || 'restaurants',
            cityName,
            dishName,
            date: date || Date.now(),
            source: 'momenty'
        };

        console.log(`[Sync Kol Youm] Sending payload to Kol Youm:`, payload);

        // Reverting to the domain confirmed by the user
        const targetUrl = 'https://kol-youm-app.vercel.app/api/external-visit';

        const response = await fetch(targetUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-API-Key': apiKey,
            },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            const errorText = await response.text().catch(() => 'No error text');
            console.error('[Sync Kol Youm] Kol Youm API returned error:', response.status, errorText);

            let errorData = {};
            try {
                errorData = JSON.parse(errorText);
            } catch (e) {
                errorData = { raw: errorText.substring(0, 100) };
            }

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
