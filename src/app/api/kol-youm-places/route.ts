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
            const places: { label: string; zone: string }[] = [];
            const seen = new Set<string>();

            data.data.zones.forEach((zoneItem: any) => {
                const zoneName = zoneItem.zone;
                const categories = zoneItem.categories;

                if (categories) {
                    // Helper function to add places from a category
                    const addPlaces = (categoryArray: string[] | undefined) => {
                        if (categoryArray && Array.isArray(categoryArray)) {
                            categoryArray.forEach((place: string) => {
                                if (place && !seen.has(place)) {
                                    places.push({ label: place, zone: zoneName });
                                    seen.add(place);
                                }
                            });
                        }
                    };

                    addPlaces(categories.restaurants);
                    addPlaces(categories.cafes);
                    addPlaces(categories.fastFoods);
                    addPlaces(categories.brunch);
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
