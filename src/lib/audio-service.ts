
/**
 * Service to fetch ambient sounds and music from external APIs.
 * Currently using Hearthis.at API (no API key required for basic search).
 */

export interface RemoteSound {
    id: string;
    name: string;
    url: string;
    icon: string;
    category: string;
    duration?: number;
    artist?: string;
}

export const searchHearthis = async (query: string): Promise<RemoteSound[]> => {
    try {
        // Hearthis API v2 search endpoint
        // Using count=10 to keep it manageable
        const response = await fetch(`https://api-v2.hearthis.at/search/?t=${encodeURIComponent(query)}&count=10&page=1`);
        
        if (!response.ok) {
            throw new Error('Hearthis API response was not ok');
        }

        const data = await response.json();
        
        if (!Array.isArray(data)) return [];

        return data.map((track: any) => ({
            id: `hearthis-${track.id}`,
            name: track.title,
            url: track.stream_url, // Direct stream URL
            icon: '🎵',
            category: track.genre || 'Ambiance',
            duration: parseInt(track.duration),
            artist: track.user.username
        }));
    } catch (error) {
        console.error('Error fetching from Hearthis:', error);
        return [];
    }
};

export const getPopularHearthis = async (): Promise<RemoteSound[]> => {
    try {
        const response = await fetch(`https://api-v2.hearthis.at/feed/?type=popular&count=8&page=1`);
        
        if (!response.ok) {
            throw new Error('Hearthis API response was not ok');
        }

        const data = await response.json();
        
        if (!Array.isArray(data)) return [];

        return data.map((track: any) => ({
            id: `hearthis-pop-${track.id}`,
            name: track.title,
            url: track.stream_url,
            icon: '✨',
            category: track.genre || 'Populaire',
            duration: parseInt(track.duration),
            artist: track.user.username
        }));
    } catch (error) {
        console.error('Error fetching popular from Hearthis:', error);
        return [];
    }
};
