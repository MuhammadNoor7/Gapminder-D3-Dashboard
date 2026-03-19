// Global state
const globalState2 = {
    currentYear: 1800,
    isPlaying: false,
    data: null,
    worldMap: null,
    selectedContinent: null,
    timer: null
};

// Load merged dataset
async function loadGapminderData() {
    try {
        console.log('Loading merged_dataset.csv...');
        // Try both paths - parent directory and current directory
        let csvPath = '../merged_dataset.csv';
        let data;
        try {
            data = await d3.csv(csvPath, d => {
                return {
                    country: d.name,
                    geo: d.geo,
                    year: +d.year,
                    gdp: d.gdp && d.gdp !== '' ? +d.gdp : null,
                    lifeExp: d.lifeExp && d.lifeExp !== '' ? +d.lifeExp : null,
                    pop: d.pop && d.pop !== '' ? +d.pop : null
                };
            });
        } catch (e) {
            // Try current directory
            csvPath = 'merged_dataset.csv';
            data = await d3.csv(csvPath, d => {
                return {
                    country: d.name,
                    geo: d.geo,
                    year: +d.year,
                    gdp: d.gdp && d.gdp !== '' ? +d.gdp : null,
                    lifeExp: d.lifeExp && d.lifeExp !== '' ? +d.lifeExp : null,
                    pop: d.pop && d.pop !== '' ? +d.pop : null
                };
            });
        }
        
        // Don't filter here - store all data, filter when needed
        // Add continent information to all data
        data.forEach(d => {
            d.continent = getContinentFromCountry(d.country);
        });
        
        globalState2.data = data;
        console.log(`Loaded ${data.length} data points from ${new Set(data.map(d => d.country)).size} countries`);
        return data;
    } catch (error) {
        console.error('Error loading Gapminder data:', error);
        return [];
    }
}

// Get continent from country name
function getContinentFromCountry(country) {
    if (!country) return 'Unknown';
    
    const normalized = country.trim();
    
    const continentMap = {
        // Americas
        'United States': 'Americas', 'USA': 'Americas', 'United States of America': 'Americas', 'US': 'Americas',
        'Canada': 'Americas', 'Mexico': 'Americas', 'Brazil': 'Americas',
        'Argentina': 'Americas', 'Chile': 'Americas', 'Colombia': 'Americas',
        'Peru': 'Americas', 'Venezuela': 'Americas', 'Ecuador': 'Americas',
        'Guatemala': 'Americas', 'Cuba': 'Americas', 'Haiti': 'Americas',
        'Dominican Republic': 'Americas', 'Honduras': 'Americas', 'El Salvador': 'Americas',
        'Nicaragua': 'Americas', 'Costa Rica': 'Americas', 'Panama': 'Americas',
        'Jamaica': 'Americas', 'Trinidad and Tobago': 'Americas', 'Uruguay': 'Americas',
        'Paraguay': 'Americas', 'Bolivia': 'Americas',
        
        // Asia - comprehensive list
        'China': 'Asia', 'India': 'Asia', 'Japan': 'Asia', 'South Korea': 'Asia',
        'Korea, Rep.': 'Asia', 'Korea': 'Asia',
        'Indonesia': 'Asia', 'Pakistan': 'Asia', 'Bangladesh': 'Asia',
        'Philippines': 'Asia', 'Vietnam': 'Asia', 'Viet Nam': 'Asia', 'Thailand': 'Asia',
        'Myanmar': 'Asia', 'Burma': 'Asia', 'Myanmar (Burma)': 'Asia', 'Malaysia': 'Asia', 
        'Afghanistan': 'Asia', 'Iraq': 'Asia', 'Saudi Arabia': 'Asia', 'Iran': 'Asia',
        'Iran, Islamic Rep.': 'Asia',
        'Turkey': 'Asia', 'Türkiye': 'Asia', 'Israel': 'Asia', 
        'United Arab Emirates': 'Asia', 'UAE': 'Asia',
        'Singapore': 'Asia', 'Hong Kong': 'Asia', 'Taiwan': 'Asia',
        'Sri Lanka': 'Asia', 'Nepal': 'Asia', 'Kazakhstan': 'Asia',
        'Uzbekistan': 'Asia', 'North Korea': 'Asia', 
        'Korea, Democratic People\'s Republic of': 'Asia',
        'Syria': 'Asia', 'Syrian Arab Republic': 'Asia',
        'Yemen': 'Asia', 'Yemen, Rep.': 'Asia', 'Jordan': 'Asia', 'Lebanon': 'Asia',
        'Kuwait': 'Asia', 'Qatar': 'Asia', 'Oman': 'Asia',
        'Cambodia': 'Asia', 'Laos': 'Asia', 'Lao PDR': 'Asia', 'Mongolia': 'Asia',
        'Bhutan': 'Asia', 'Maldives': 'Asia', 'Brunei': 'Asia',
        'Turkmenistan': 'Asia', 'Tajikistan': 'Asia', 'Kyrgyzstan': 'Asia',
        'Georgia': 'Asia', 'Armenia': 'Asia', 'Azerbaijan': 'Asia',
        
        // Europe
        'Germany': 'Europe', 'France': 'Europe', 'United Kingdom': 'Europe',
        'UK': 'Europe', 'Great Britain': 'Europe', 'Britain': 'Europe', 'GB': 'Europe', 'gbr': 'Europe',
        'Italy': 'Europe', 'Spain': 'Europe', 'Russia': 'Europe', 'Russian Federation': 'Europe',
        'Poland': 'Europe', 'Ukraine': 'Europe', 'Romania': 'Europe',
        'Netherlands': 'Europe', 'Belgium': 'Europe', 'Greece': 'Europe',
        'Portugal': 'Europe', 'Czech Republic': 'Europe', 'Czechia': 'Europe', 'Hungary': 'Europe',
        'Sweden': 'Europe', 'Belarus': 'Europe', 'Austria': 'Europe',
        'Switzerland': 'Europe', 'Bulgaria': 'Europe', 'Serbia': 'Europe',
        'Denmark': 'Europe', 'Finland': 'Europe', 'Slovakia': 'Europe',
        'Ireland': 'Europe', 'Norway': 'Europe', 'Croatia': 'Europe',
        'Bosnia and Herzegovina': 'Europe', 'Albania': 'Europe', 'Lithuania': 'Europe',
        'Slovenia': 'Europe', 'Latvia': 'Europe', 'Estonia': 'Europe',
        'Macedonia': 'Europe', 'North Macedonia': 'Europe', 'Moldova': 'Europe',
        
        // Africa
        'Nigeria': 'Africa', 'Ethiopia': 'Africa', 'Egypt': 'Africa',
        'South Africa': 'Africa', 'Kenya': 'Africa', 'Uganda': 'Africa',
        'Sudan': 'Africa', 'Algeria': 'Africa', 'Morocco': 'Africa',
        'Angola': 'Africa', 'Ghana': 'Africa', 'Mozambique': 'Africa',
        'Madagascar': 'Africa', 'Cameroon': 'Africa', 'Ivory Coast': 'Africa', 'Côte d\'Ivoire': 'Africa', 'Cote d\'Ivoire': 'Africa',
        'Niger': 'Africa', 'Mali': 'Africa', 'Burkina Faso': 'Africa',
        'Malawi': 'Africa', 'Zambia': 'Africa', 'Zimbabwe': 'Africa',
        'Senegal': 'Africa', 'Chad': 'Africa', 'Guinea': 'Africa',
        'Rwanda': 'Africa', 'Tunisia': 'Africa', 'Benin': 'Africa',
        'Burundi': 'Africa', 'Somalia': 'Africa', 'Tanzania': 'Africa',
        'Libya': 'Africa',
        'Congo': 'Africa', 'Congo, Republic of the': 'Africa', 'Congo, Rep.': 'Africa', 'Republic of Congo': 'Africa',
        'DR Congo': 'Africa', 'Congo, Democratic Republic of the': 'Africa', 'Congo, Dem. Rep.': 'Africa',
        'Democratic Republic of the Congo': 'Africa', 'Democratic Republic of Congo': 'Africa', 'Zaire': 'Africa', 'cod': 'Africa', 'cog': 'Africa',
        
        // Oceania - comprehensive list with variations
        'Australia': 'Oceania', 'New Zealand': 'Oceania', 'Papua New Guinea': 'Oceania',
        'Fiji': 'Oceania', 'Tuvalu': 'Oceania', 'Talau': 'Oceania', 'Kiribati': 'Oceania',
        'Samoa': 'Oceania', 'Tonga': 'Oceania', 'Vanuatu': 'Oceania', 'Solomon Islands': 'Oceania', 'tuv': 'Oceania',
        'Micronesia': 'Oceania', 'Micronesia, Fed. Sts.': 'Oceania', 'Micronesia (Federated States of)': 'Oceania',
        'Marshall Islands': 'Oceania', 'Palau': 'Oceania', 'Nauru': 'Oceania',
        'New Caledonia': 'Oceania', 'French Polynesia': 'Oceania', 'Guam': 'Oceania',
        'Northern Mariana Islands': 'Oceania', 'American Samoa': 'Oceania', 'Cook Islands': 'Oceania'
    };
    
    // Try exact match first
    if (continentMap[normalized]) {
        return continentMap[normalized];
    }
    
    // Try case-insensitive match
    for (const [key, value] of Object.entries(continentMap)) {
        if (key.toLowerCase() === normalized.toLowerCase()) {
            return value;
        }
    }
    
    // Try partial match for common patterns
    const lower = normalized.toLowerCase();
    if (lower.includes('congo')) {
        if (lower.includes('democratic') || lower.includes('dem') || lower.includes('dr')) {
            return 'Africa';
        }
        return 'Africa';
    }
    if (lower === 'uk' || lower === 'united kingdom' || lower.includes('britain')) {
        return 'Europe';
    }
    if (lower === 'tuvalu' || lower === 'talau') {
        return 'Oceania';
    }
    
    // Partial match for Oceania countries
    if (lower.includes('papua') || lower.includes('new guinea') || 
        lower.includes('micronesia') || lower.includes('marshall') ||
        lower.includes('palau') || lower.includes('nauru') ||
        lower.includes('samoa') || lower.includes('tonga') ||
        lower.includes('fiji') || lower.includes('vanuatu') ||
        lower.includes('kiribati') || lower.includes('solomon') ||
        lower.includes('new caledonia') || lower.includes('polynesia') ||
        lower === 'australia' || lower === 'new zealand') {
        return 'Oceania';
    }
    
    // Default unmapped countries to Europe (instead of Unknown)
    // This ensures all countries are assigned to a continent
    return 'Europe';
}

// Load world map GeoJSON
async function loadWorldMap2() {
    try {
        // Try to load from local file first
        const world = await d3.json('world.geojson');
        if (world && world.features) {
            globalState2.worldMap = world;
            console.log('Loaded world.geojson');
            return world;
        }
        throw new Error('Invalid GeoJSON format');
    } catch (error) {
        // Fallback to CDN if local file doesn't exist
        try {
            console.log('Local world.geojson not found, trying CDN...');
            const world = await d3.json('https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json');
            // Check if it's TopoJSON and convert to GeoJSON
            if (world.objects && typeof topojson !== 'undefined') {
                const features = topojson.feature(world, world.objects.countries);
                globalState2.worldMap = features;
                console.log('Loaded and converted world map from CDN (TopoJSON)');
                return features;
            } else if (world.features) {
                globalState2.worldMap = world;
                console.log('Loaded world map from CDN (GeoJSON)');
                return world;
            } else {
                throw new Error('Unknown map format');
            }
        } catch (cdnError) {
            console.error('Error loading world map:', cdnError);
            return null;
        }
    }
}

// Get data for a specific year
// For motion chart: requires all three values (gdp, lifeExp, pop)
// For other charts: can work with partial data
function getDataForYear(year, requireAll = true) {
    if (!globalState2.data) return [];
    if (requireAll) {
        return globalState2.data.filter(d => 
            d.year === year && 
            d.gdp !== null && d.gdp > 0 && 
            d.lifeExp !== null && d.lifeExp > 0 && 
            d.pop !== null && d.pop > 0
        );
    } else {
        return globalState2.data.filter(d => d.year === year);
    }
}

// Get country data for a specific country and year
function getCountryData(country, year) {
    if (!globalState2.data) return null;
    return globalState2.data.find(d => d.country === country && d.year === year);
}

// Color scales (removed Unknown)
const continentColors = {
    'Americas': '#e74c3c',
    'Asia': '#3498db',
    'Europe': '#2ecc71',
    'Africa': '#f39c12',
    'Oceania': '#9b59b6'
};

function getContinentColor(continent) {
    if (!continent) return continentColors['Europe']; // Default to Europe
    
    // Normalize continent name (trim and handle case)
    const normalized = String(continent).trim();
    
    // Try exact match first
    if (continentColors[normalized]) {
        return continentColors[normalized];
    }
    
    // Try case-insensitive match
    for (const [key, value] of Object.entries(continentColors)) {
        if (key.toLowerCase() === normalized.toLowerCase()) {
            return value;
        }
    }
    
    return continentColors['Europe']; // Default to Europe instead of Unknown
}

// Format population for display
function formatPopulation(pop) {
    if (pop >= 1e9) return (pop / 1e9).toFixed(2) + 'B';
    if (pop >= 1e6) return (pop / 1e6).toFixed(2) + 'M';
    if (pop >= 1e3) return (pop / 1e3).toFixed(2) + 'K';
    return pop.toFixed(0);
}

// Export functions
export { 
    globalState2, 
    loadGapminderData, 
    loadWorldMap2, 
    getDataForYear, 
    getCountryData, 
    getContinentFromCountry, 
    getContinentColor, 
    formatPopulation 
};

