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
        const { userEmail, placeName, category, cityName, dishName, date, postUrl, momentyImageUrl } = body;
        const cleanEmail = userEmail?.trim().toLowerCase();
        const finalCategory = category || 'restaurants';

        // Validation (dishName is optional for Kharjet)
        if (!cleanEmail || !placeName || !cityName || (!dishName && finalCategory !== 'Kharjet')) {
            console.error('[Sync Kol Youm] Validation failed:', { cleanEmail, placeName, cityName, dishName, finalCategory });
            return NextResponse.json(
                { success: false, error: 'Missing required fields' },
                { status: 400 }
            );
        }

        console.log(`[Sync Kol Youm] Processing request for: ${placeName} (${finalCategory})`);

        const payload = {
            userEmail: cleanEmail,
            placeName,
            category: finalCategory,
            cityName,
            dishName: dishName || null,
            date: date || Date.now(),
            source: 'momenty',
            postUrl: postUrl || null,
            momentyImageUrl: momentyImageUrl || null
        };

        console.log(`[Sync Kol Youm] Sending payload to production:`, payload);

        const targetUrl = 'https://kol-youm-app.vercel.app/api/external-visit';

        const response = await fetch(targetUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'X-API-Key': apiKey,
            },
            body: JSON.stringify(payload),
            redirect: 'follow'
        });

        const text = await response.text().catch(() => 'No body');

        if (!response.ok) {
            console.error(`[Sync Kol Youm] Failed to sync: ${response.status}`, text);
            return NextResponse.json(
                {
                    success: false,
                    error: `Kol Youm API error: ${response.status}`,
                    details: { raw: text.substring(0, 200) }
                },
                { status: response.status }
            );
        }

        const result = JSON.parse(text);
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
