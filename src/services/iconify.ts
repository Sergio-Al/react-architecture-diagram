/**
 * Iconify API Service
 * Wrapper for the Iconify Search API to find and browse icons
 */

export interface IconifySearchResult {
  icons: string[];
  total: number;
}

export interface IconifyCollection {
  prefix: string;
  name: string;
  total: number;
  author?: {
    name: string;
    url?: string;
  };
  license?: {
    title: string;
    spdx?: string;
    url?: string;
  };
  samples?: string[];
  height?: number | number[];
  displayHeight?: number;
  category?: string;
  palette?: boolean;
}

export interface IconifyCollectionsResponse {
  [prefix: string]: IconifyCollection;
}

const ICONIFY_API_BASE = 'https://api.iconify.design';

/**
 * Search for icons matching a query
 * @param query - Search term (e.g., "database", "docker")
 * @param collection - Optional collection filter (e.g., "mdi", "logos")
 * @param limit - Maximum number of results (default: 48)
 */
export async function searchIcons(
  query: string,
  collection?: string,
  limit: number = 48
): Promise<IconifySearchResult> {
  try {
    const params = new URLSearchParams({
      query,
      limit: limit.toString(),
    });

    if (collection) {
      params.append('prefix', collection);
    }

    const response = await fetch(`${ICONIFY_API_BASE}/search?${params}`);
    
    if (!response.ok) {
      throw new Error(`Iconify API error: ${response.status}`);
    }

    const data = await response.json();
    
    return {
      icons: data.icons || [],
      total: data.total || 0,
    };
  } catch (error) {
    console.error('Failed to search icons:', error);
    throw new Error('Failed to search icons. Please check your internet connection.');
  }
}

/**
 * Fetch available icon collections/sets
 */
export async function getCollections(): Promise<IconifyCollection[]> {
  try {
    const response = await fetch(`${ICONIFY_API_BASE}/collections`);
    
    if (!response.ok) {
      throw new Error(`Iconify API error: ${response.status}`);
    }

    const data: IconifyCollectionsResponse = await response.json();
    
    // Convert object to array and sort by popularity (total icons)
    return Object.entries(data)
      .map(([prefix, collection]) => ({
        ...collection,
        prefix,
      }))
      .sort((a, b) => (b.total || 0) - (a.total || 0));
  } catch (error) {
    console.error('Failed to fetch collections:', error);
    throw new Error('Failed to fetch icon collections. Please check your internet connection.');
  }
}

/**
 * Get popular/featured collections for quick access
 */
export function getFeaturedCollections(): string[] {
  return [
    'mdi', // Material Design Icons
    'logos', // Brand logos
    'devicon', // Programming languages & tools
    'simple-icons', // Brand icons
    'carbon', // IBM Carbon Design
    'tabler', // Tabler Icons
    'heroicons', // Heroicons
    'lucide', // Lucide Icons
    'fa6-brands', // Font Awesome Brands
    'material-symbols', // Material Symbols
  ];
}
