
/**
 * Service to fetch ambient sounds and music from external APIs.
 * Using Hearthis.at (ambience/sfx) and iTunes (popular music previews).
 */

export interface RemoteSound {
    id: string;
    name: string;
    url: string;
    icon: string;
    category: string;
    duration?: number;
    artist?: string;
    artwork?: string;
}

export const searchITunes = async (query: string): Promise<RemoteSound[]> => {
    try {
        const response = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(query)}&media=music&limit=15`);
        
        if (!response.ok) {
            throw new Error('iTunes API response was not ok');
        }

        const data = await response.json();
        
        if (!data.results || !Array.isArray(data.results)) return [];

        return data.results.map((track: any) => ({
            id: `itunes-${track.trackId}`,
            name: track.trackName,
            url: track.previewUrl, // 30s preview
            icon: '🎵',
            category: 'Musique',
            duration: 30,
            artist: track.artistName,
            artwork: track.artworkUrl100
        }));
    } catch (error) {
        console.error('Error fetching from iTunes:', error);
        return [];
    }
};

export const searchHearthis = async (query: string): Promise<RemoteSound[]> => {
    try {
        const response = await fetch(`https://api-v2.hearthis.at/search/?t=${encodeURIComponent(query)}&count=15&page=1`);
        
        if (!response.ok) {
            throw new Error('Hearthis API response was not ok');
        }

        const data = await response.json();
        
        if (!Array.isArray(data)) return [];

        return data.map((track: any) => ({
            id: `hearthis-${track.id}`,
            name: track.title,
            url: track.stream_url.startsWith('http:') ? track.stream_url.replace('http:', 'https:') : track.stream_url,
            icon: '✨',
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
        const response = await fetch(`https://api-v2.hearthis.at/feed/?type=popular&count=10&page=1`);
        
        if (!response.ok) {
            throw new Error('Hearthis API response was not ok');
        }

        const data = await response.json();
        
        if (!Array.isArray(data)) return [];

        return data.map((track: any) => ({
            id: `hearthis-pop-${track.id}`,
            name: track.title,
            url: track.stream_url.startsWith('http:') ? track.stream_url.replace('http:', 'https:') : track.stream_url,
            icon: '📈',
            category: track.genre || 'Populaire',
            duration: parseInt(track.duration),
            artist: track.user.username
        }));
    } catch (error) {
        console.error('Error fetching popular from Hearthis:', error);
        return [];
    }
};
