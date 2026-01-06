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

        console.log(`[Sync Kol Youm] Sending payload:`, payload);

        // On essaie les deux domaines possibles sans slash final forcé
        const urls = [
            'https://kol-youm-app.vercel.app/api/external-visit',
            'https://kol-youm.vercel.app/api/external-visit'
        ];

        let lastResponseStatus = 500;
        let lastErrorText: string = "";
        let successResult: any = null;

        for (const url of urls) {
            try {
                console.log(`[Sync Kol Youm] Attempting fetch to: ${url}`);
                const response = await fetch(url, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json',
                        'X-API-Key': apiKey,
                    },
                    body: JSON.stringify(payload),
                    redirect: 'follow'
                });

                if (response.ok) {
                    successResult = await response.json();
                    console.log(`[Sync Kol Youm] Success with ${url}`);
                    break;
                } else {
                    lastResponseStatus = response.status;
                    const text = await response.text().catch(() => 'No body');
                    lastErrorText = text;
                    console.warn(`[Sync Kol Youm] Failed URL ${url}: ${response.status} - ${text.substring(0, 100)}`);
                }
            } catch (err) {
                console.error(`[Sync Kol Youm] Error fetching ${url}:`, err);
            }
        }

        if (successResult) {
            return NextResponse.json({
                success: true,
                message: 'Successfully synced with Kol Youm',
                data: successResult,
            });
        }

        return NextResponse.json(
            {
                success: false,
                error: `Kol Youm API error: ${lastResponseStatus}`,
                details: { raw: lastErrorText.substring(0, 200) }
            },
            { status: lastResponseStatus }
        );


    } catch (error) {
        console.error('[Sync Kol Youm] Unexpected error:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}
