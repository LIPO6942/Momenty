import { NextResponse } from 'next/server';

export async function GET() {
    try {
        const response = await fetch('https://kol-youm-app.vercel.app/api/places-database-firestore', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
            cache: 'no-store', // Don't cache to always get fresh data
        });

        if (!response.ok) {
            console.error('[Kol Youm Proxy] API returned error:', response.status, response.statusText);
            return NextResponse.json(
                { success: false, error: `API error: ${response.status}` },
                { status: response.status }
            );
        }

        const data = await response.json();

        // Parse and flatten the places data
        if (data.success && data.data && Array.isArray(data.data.zones)) {
            const places: { label: string; zone: string; category: string }[] = [];
            const seen = new Set<string>();

            data.data.zones.forEach((zoneItem: any) => {
                const zoneName = zoneItem.zone;
                const categories = zoneItem.categories;

                if (categories) {
                    // Helper function to add places from a category
                    const addPlaces = (categoryArray: string[] | undefined, categoryName: string) => {
                        if (categoryArray && Array.isArray(categoryArray)) {
                            categoryArray.forEach((place: string) => {
                                const seenKey = `${place.toLowerCase()}-${zoneName.toLowerCase()}`;
                                if (place && !seen.has(seenKey)) {
                                    places.push({ label: place, zone: zoneName, category: categoryName });
                                    seen.add(seenKey);
                                }
                            });
                        }
                    };

                    addPlaces(categories.restaurants, 'restaurants');
                    addPlaces(categories.cafes, 'cafes');
                    addPlaces(categories.fastFoods, 'fastFoods');
                    addPlaces(categories.brunch, 'brunch');
                }
            });

            // Sort alphabetically
            places.sort((a, b) => a.label.localeCompare(b.label));

            console.log(`[Kol Youm Proxy] Loaded ${places.length} places`);

            return NextResponse.json({
                success: true,
                places: places,
                totalZones: data.data.zones.length,
            });
        } else {
            console.error('[Kol Youm Proxy] Invalid response structure from API');
            return NextResponse.json(
                { success: false, error: 'Invalid API response structure' },
                { status: 500 }
            );
        }
    } catch (error) {
        console.error('[Kol Youm Proxy] Failed to fetch:', error);
        return NextResponse.json(
            { success: false, error: 'Failed to fetch places' },
            { status: 500 }
        );
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { zone, placeName, category, action } = body;

        if (!zone || !placeName) {
            return NextResponse.json(
                { success: false, error: 'Zone et nom du lieu requis' },
                { status: 400 }
            );
        }

        console.log(`[Kol Youm Places Proxy] Adding place "${placeName}" in zone "${zone}" (${category || 'restaurants'})`);

        const response = await fetch('https://kol-youm-app.vercel.app/api/places-database-firestore', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                action: action || 'addPlace',
                zone: zone.trim(),
                placeName: placeName.trim(),
                category: category || 'restaurants',
            }),
        });

        if (!response.ok) {
            const errText = await response.text();
            console.error('[Kol Youm Places Proxy POST Error]:', response.status, errText);
            return NextResponse.json(
                { success: false, error: `Erreur API Kol Youm: ${response.status}`, details: errText },
                { status: response.status }
            );
        }

        const data = await response.json();
        return NextResponse.json({ success: true, ...data });
    } catch (error) {
        console.error('[Kol Youm Places Proxy POST Exception]:', error);
        return NextResponse.json(
            { success: false, error: error instanceof Error ? error.message : 'Échec de l\'ajout dans Kol Youm' },
            { status: 500 }
        );
    }
}
