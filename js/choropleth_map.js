import { globalState2, loadWorldMap2, getDataForYear, getCountryData, formatPopulation } from './utils.js';

let mapSvg, mapG, projection2, path2, colorScale, zoom;
const margin = { top: 20, right: 20, bottom: 20, left: 20 };
let width, height;

const COUNTRY_ID_MAPPING = {
    '4': 'afg', '8': 'alb', '12': 'dza', '16': 'asm', '20': 'and', '24': 'ago',
    '28': 'atg', '31': 'aze', '32': 'arg', '36': 'aus', '40': 'aut', '44': 'bhs',
    '48': 'bhr', '50': 'bgd', '51': 'arm', '52': 'brb', '56': 'bel', '60': 'bmu',
    '64': 'btn', '68': 'bol', '70': 'bih', '72': 'bwa', '76': 'bra', '84': 'blz',
    '90': 'slb', '92': 'vgb', '96': 'brn', '100': 'bgr', '104': 'mmr', '108': 'bdi',
    '112': 'blr', '116': 'khm', '120': 'cmr', '124': 'can', '132': 'cpv', '136': 'cym',
    '140': 'caf', '144': 'lka', '148': 'tcd', '152': 'chl', '156': 'chn', '170': 'col',
    '174': 'com', '178': 'cog', '180': 'cod', '188': 'cri', '191': 'hrv', '192': 'cub',
    '196': 'cyp', '203': 'cze', '204': 'ben', '208': 'dnk', '212': 'dma', '214': 'dom',
    '218': 'ecu', '222': 'slv', '226': 'gnq', '231': 'eth', '232': 'eri', '233': 'est',
    '234': 'fro', '238': 'flk', '242': 'fji', '246': 'fin', '250': 'fra', '258': 'pyf',
    '262': 'dji', '266': 'gab', '268': 'geo', '270': 'gmb', '275': 'pse', '276': 'deu',
    '288': 'gha', '292': 'gib', '296': 'kir', '300': 'grc', '304': 'grl', '308': 'grd',
    '312': 'glp', '316': 'gum', '320': 'gtm', '324': 'gin', '328': 'guy', '332': 'hti',
    '336': 'vat', '340': 'hnd', '344': 'hkg', '348': 'hun', '352': 'isl', '356': 'ind',
    '360': 'idn', '364': 'irn', '368': 'irq', '372': 'irl', '376': 'isr', '380': 'ita',
    '384': 'civ', '388': 'jam', '392': 'jpn', '398': 'kaz', '400': 'jor', '404': 'ken',
    '408': 'prk', '410': 'kor', '414': 'kwt', '417': 'kgz', '418': 'lao', '422': 'lbn',
    '426': 'lso', '428': 'lva', '430': 'lbr', '434': 'lby', '438': 'lie', '440': 'ltu',
    '442': 'lux', '446': 'mac', '450': 'mdg', '454': 'mwi', '458': 'mys', '462': 'mdv',
    '466': 'mli', '470': 'mlt', '474': 'mtq', '478': 'mrt', '480': 'mus', '484': 'mex',
    '492': 'mco', '496': 'mng', '498': 'mda', '499': 'mne', '504': 'mar', '508': 'moz',
    '512': 'omn', '516': 'nam', '520': 'nru', '524': 'npl', '528': 'nld', '540': 'ncl',
    '548': 'vut', '554': 'nzl', '558': 'nic', '562': 'ner', '566': 'nga', '578': 'nor',
    '580': 'mnp', '583': 'fsm', '584': 'mhl', '585': 'plw', '586': 'pak', '591': 'pan',
    '598': 'png', '600': 'pry', '604': 'per', '608': 'phl', '616': 'pol', '620': 'prt',
    '624': 'gnb', '626': 'tls', '634': 'qat', '642': 'rou', '643': 'rus', '646': 'rwa',
    '659': 'kna', '662': 'lca', '670': 'vct', '674': 'smr', '678': 'stp', '682': 'sau',
    '686': 'sen', '688': 'srb', '690': 'syc', '694': 'sle', '702': 'sgp', '703': 'svk',
    '704': 'vnm', '705': 'svn', '706': 'som', '710': 'zaf', '716': 'zwe', '724': 'esp',
    '728': 'ssd', '729': 'sdn', '732': 'esh', '740': 'sur', '748': 'swz', '752': 'swe',
    '756': 'che', '760': 'syr', '762': 'tjk', '764': 'tha', '768': 'tgo', '776': 'ton',
    '780': 'tto', '784': 'are', '788': 'tun', '792': 'tur', '795': 'tkm', '798': 'tuv',
    '800': 'uga', '804': 'ukr', '807': 'mkd', '818': 'egy', '826': 'gbr', '831': 'ggy',
    '832': 'jey', '833': 'iom', '834': 'tza', '840': 'usa', '850': 'vir', '854': 'bfa',
    '858': 'ury', '860': 'uzb', '862': 'ven', '876': 'wlf', '882': 'wsm', '887': 'yem',
    '894': 'zmb'
};

function getCountryCodeFromId(id) {
    if (!id) return null;
    return COUNTRY_ID_MAPPING[id.toString()] || null;
}

// Country name mapping for GeoJSON properties
const countryNameMap = {
    'United States of America': 'United States',
    'United States': 'United States',
    'USA': 'United States',
    'Russian Federation': 'Russia',
    'Korea, Rep.': 'South Korea',
    'Korea, Democratic People\'s Republic of': 'North Korea',
    'Iran, Islamic Rep.': 'Iran',
    'Egypt, Arab Rep.': 'Egypt',
    'Venezuela, RB': 'Venezuela',
    'Syrian Arab Republic': 'Syria',
    'Lao PDR': 'Laos',
    'Congo, Dem. Rep.': 'Democratic Republic of Congo',
    'Congo, Rep.': 'Republic of Congo',
    'Yemen, Rep.': 'Yemen',
    'Türkiye': 'Turkey',
    'Czechia': 'Czech Republic',
    'Slovak Republic': 'Slovakia',
    'Viet Nam': 'Vietnam',
    'Myanmar (Burma)': 'Myanmar',
    'UK': 'United Kingdom',
    'GB': 'United Kingdom',
    'gbr': 'United Kingdom'
};

function normalizeCountryName(name) {
    if (!name) return null;
    return countryNameMap[name] || name;
}

function getGeoName(properties) {
    if (!properties) return null;
    return normalizeCountryName(properties.NAME) || 
           normalizeCountryName(properties.NAME_LONG) || 
           normalizeCountryName(properties.name) ||
           normalizeCountryName(properties.NAME_EN);
}

function findCountryData(geoJsonName, yearData, geoJsonId = null) {
    if (!yearData) return null;
    
    if (geoJsonId) {
        const countryCode = getCountryCodeFromId(geoJsonId);
        if (countryCode) {
            // Match by geo code (3-letter ISO code)
            const match = yearData.find(d => d.geo && d.geo.toLowerCase() === countryCode.toLowerCase());
            if (match) return match;
        }
    }
    
    // Fallback to name matching
    if (!geoJsonName) return null;
    
    // Try exact match first
    let match = yearData.find(d => 
        d.country === geoJsonName || 
        d.country.toLowerCase() === geoJsonName.toLowerCase()
    );
    
    if (match) return match;
    
    // Try matching by geo code from name
    const geoCode = geoJsonName.substring(0, 3).toLowerCase();
    match = yearData.find(d => d.geo && d.geo.toLowerCase() === geoCode);
    
    return match;
}

function initChoroplethMap() {
    d3.select('#choropleth-map').selectAll('svg').remove();
    
    const container = d3.select('#choropleth-map');
    const containerNode = container.node();
    width = containerNode ? containerNode.getBoundingClientRect().width || 960 : 960;
    height = 500;
    
    mapSvg = container
        .append('svg')
        .attr('width', '100%')
        .attr('height', '100%')
        .attr('viewBox', `0 0 ${width} ${height}`)
        .attr('preserveAspectRatio', 'xMidYMid meet')
        .style('background', '#fafafa');
    
    projection2 = d3.geoNaturalEarth1()
        .scale(width / 6)
        .translate([width / 2, height / 2]);
    
    path2 = d3.geoPath().projection(projection2);
    
    // Create main group for zoomable content
    mapG = mapSvg.append('g').attr('class', 'map-group');
    
    // Color scale for life expectancy - using a different red scheme (distinct from population map)
    // Custom red-orange-yellow gradient: light cream -> orange -> red -> dark red
    // This is different from YlOrRd (which goes yellow->orange->red) and from population maps
    const customColorInterpolator = t => {
        if (t < 0.25) {
            // Light cream to light orange
            return d3.interpolateRgb('#fff5f0', '#ffd4a3')(t * 4);
        } else if (t < 0.5) {
            // Light orange to orange
            return d3.interpolateRgb('#ffd4a3', '#ffa94d')((t - 0.25) * 4);
        } else if (t < 0.75) {
            // Orange to red
            return d3.interpolateRgb('#ffa94d', '#ff6b6b')((t - 0.5) * 4);
        } else {
            // Red to dark red
            return d3.interpolateRgb('#ff6b6b', '#c92a2a')((t - 0.75) * 4);
        }
    };
    
    colorScale = d3.scaleSequential(customColorInterpolator)
        .domain([0, 90]);
    
    // Add zoom behavior
    zoom = d3.zoom()
        .scaleExtent([0.5, 8])
        .on('zoom', handleZoom);
    
    mapSvg.call(zoom);
    
    // Load world map - loadWorldMap2 now handles TopoJSON conversion
    loadWorldMap2().then(worldData => {
        if (worldData && worldData.features) {
            globalState2.worldMap = worldData;
            fitProjection(worldData);
            if (globalState2.data) {
                renderChoropleth(worldData, globalState2.currentYear);
            } else {
                // Render map even without data (grey countries)
                renderChoropleth(worldData, globalState2.currentYear);
            }
        } else {
            console.warn('World map loaded but no features found');
        }
    }).catch(error => {
        console.error('Error loading world map:', error);
    });
}

function handleZoom(event) {
    // Apply zoom transform to the map group
    mapG.attr('transform', event.transform);
}

function fitProjection(worldData) {
    if (!worldData || !worldData.features) return;
    // Reduced space needed since title is removed
    projection2.fitSize([width, height - 80], worldData); // Leave space for legend only
    path2 = d3.geoPath().projection(projection2);
}

function renderChoropleth(worldData, year) {
    if (!worldData || !worldData.features) return;
    
    // Fit projection to ensure all countries are visible
    fitProjection(worldData);
    
    const yearData = getDataForYear(year, false); // Choropleth can work with partial data
    if (!yearData || yearData.length === 0) {
        // Still render countries even without data, just in grey
        const validFeatures = worldData.features.filter(f => f.geometry && f.geometry.type);
        const countries = mapG.selectAll('.country')
            .data(validFeatures, d => getGeoName(d.properties) || Math.random());
        
        countries.enter()
            .append('path')
            .attr('class', 'country')
            .attr('d', path2)
        .attr('fill', '#e0e0e0')
        .attr('fill-opacity', 0.5)
        .attr('stroke', '#fff')
        .attr('stroke-width', 0.5)
        .style('cursor', 'default');
        
        countries.exit().remove();
        updateLegend(year);
        return;
    }
    
    // Calculate color scale domain from data
    const lifeExpValues = yearData.map(d => d.lifeExp).filter(d => d !== null && d > 0);
    if (lifeExpValues.length > 0) {
        const minLifeExp = d3.min(lifeExpValues);
        const maxLifeExp = d3.max(lifeExpValues);
        colorScale.domain([Math.max(0, minLifeExp - 2), Math.min(90, maxLifeExp + 2)]);
    } else {
        colorScale.domain([0, 90]); // Default domain
    }
    
    const validFeatures = worldData.features.filter(f => f.geometry && f.geometry.type);
    
    const transition = globalState2.isPlaying ? 
        d3.transition().duration(500).ease(d3.easeCubicInOut) : 
        d3.transition().duration(0);
    
    const countries = mapG.selectAll('.country')
        .data(validFeatures, d => (d.id || d.properties?.id || getGeoName(d.properties)) || Math.random());
    
    // Exit
    countries.exit()
        .transition(transition)
        .attr('fill-opacity', 0)
        .remove();
    
    // Enter
    const enter = countries.enter()
        .append('path')
        .attr('class', 'country')
        .attr('d', path2)
        .attr('fill', '#e0e0e0')
        .attr('fill-opacity', 0)
        .attr('stroke', '#fff')
        .attr('stroke-width', 0.5)
        .style('cursor', 'pointer')
        .style('transition', 'all 0.2s ease')
        .on('mouseover', function(event, d) {
            d3.select(this)
                .attr('stroke-width', 2.5)
                .attr('stroke', '#2c3e50')
                .attr('fill-opacity', 1)
                .style('filter', 'brightness(1.1)');
            const geoJsonName = getGeoName(d.properties);
            const geoJsonId = d.id || d.properties?.id;
            const countryData = findCountryData(geoJsonName, yearData, geoJsonId);
            
            // Show tooltip with country data, or at least country name if no data
            if (countryData) {
                showMapTooltip(event, countryData);
            } else {
                // Show tooltip with just country name if no data available
                showMapTooltip(event, {
                    country: geoJsonName || 'Unknown',
                    lifeExp: null,
                    year: year
                });
            }
        })
        .on('mouseout', function() {
            d3.select(this)
                .attr('stroke-width', 0.5)
                .attr('stroke', '#fff')
                .attr('fill-opacity', d => {
                    const geoJsonName = getGeoName(d.properties);
                    const geoJsonId = d.id || d.properties?.id;
                    const countryData = findCountryData(geoJsonName, yearData, geoJsonId);
                    return (countryData && countryData.lifeExp !== null && countryData.lifeExp > 0) ? 0.9 : 0.5;
                })
                .style('filter', 'brightness(1)');
            hideTooltip();
        });
    

    countries.merge(enter)
        .transition(transition)
        .attr('d', path2) // Update path in case projection changed
        .attrTween('fill', function(d) {
            const geoJsonName = getGeoName(d.properties);
            const geoJsonId = d.id || d.properties?.id;
            const countryData = findCountryData(geoJsonName, yearData, geoJsonId);
            const currentFill = d3.select(this).attr('fill') || '#e0e0e0';
            const targetFill = (countryData && countryData.lifeExp !== null && countryData.lifeExp > 0) ? 
                colorScale(countryData.lifeExp) : '#e0e0e0';
            return d3.interpolateRgb(currentFill, targetFill);
        })
        .attr('fill-opacity', d => {
            const geoJsonName = getGeoName(d.properties);
            const geoJsonId = d.id || d.properties?.id;
            const countryData = findCountryData(geoJsonName, yearData, geoJsonId);
            // Show all countries - data countries at 0.9 opacity, no data at 0.5 opacity
            return (countryData && countryData.lifeExp !== null && countryData.lifeExp > 0) ? 0.9 : 0.5;
        })
        .attr('opacity', 1) // Ensure all countries are visible
        .attr('stroke', '#fff')
        .attr('stroke-width', 0.5)
        .style('transition', 'all 0.2s ease');
    
    // Update or create legend
    updateLegend(year);
}

function updateLegend(year) {
    // Remove existing legend and title
    mapG.selectAll('.legend').remove();
    mapSvg.selectAll('.map-title').remove();
    mapSvg.selectAll('.year-indicator').remove();
    
    // Create horizontal legend at the bottom (like the image)
    // Legend should be fixed position, not in zoomable group
    const legendWidth = Math.min(width * 0.6, 500);
    const legendHeight = 30;
    const legendX = (width - legendWidth) / 2;
    const legendY = height - 50; // Moved up slightly since no title
    
    const legend = mapSvg.append('g')
        .attr('class', 'legend')
        .attr('transform', `translate(${legendX}, ${legendY})`)
        .style('pointer-events', 'none');
    
    // Legend title - more aesthetic
    legend.append('text')
        .attr('class', 'legend-title')
        .attr('x', legendWidth / 2)
        .attr('y', -5)
        .attr('text-anchor', 'middle')
        .style('font-size', '14px')
        .style('font-weight', '600')
        .style('fill', '#2c3e50')
        .style('font-family', 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif')
        .text('Life Expectancy (years)');
    
    // Create gradient if it doesn't exist
    let defs = mapSvg.select('defs');
    if (defs.empty()) {
        defs = mapSvg.append('defs');
    }
    
    // Remove existing gradient
    defs.selectAll('#lifeExpGradient').remove();
    
    // Horizontal gradient
    const gradient = defs.append('linearGradient')
        .attr('id', 'lifeExpGradient')
        .attr('x1', '0%')
        .attr('x2', '100%')
        .attr('y1', '0%')
        .attr('y2', '0%');
    
    const stops = 20;
    for (let i = 0; i <= stops; i++) {
        const value = colorScale.domain()[0] + (colorScale.domain()[1] - colorScale.domain()[0]) * (i / stops);
        gradient.append('stop')
            .attr('offset', `${(i / stops) * 100}%`)
            .attr('stop-color', colorScale(value));
    }
    
    // Legend bar (horizontal) - more aesthetic with shadow
    legend.append('rect')
        .attr('width', legendWidth)
        .attr('height', legendHeight)
        .style('fill', 'url(#lifeExpGradient)')
        .style('stroke', '#2c3e50')
        .style('stroke-width', 1.5)
        .style('filter', 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))');
    
    // Legend scale for axis
    const legendScale = d3.scaleLinear()
        .domain(colorScale.domain())
        .range([0, legendWidth]);
    
    // Use specific, well-spaced tick values to avoid clutter (like reference image: 20, 40, 60, 80)
    const minVal = Math.max(0, Math.floor(colorScale.domain()[0]));
    const maxVal = Math.min(90, Math.ceil(colorScale.domain()[1]));
    
    // Create clean, evenly spaced ticks (4-5 ticks total for clean look)
    // Round to nice numbers (multiples of 10 or 20)
    const range = maxVal - minVal;
    let step;
    if (range <= 20) {
        step = 5; // Small range: steps of 5
    } else if (range <= 40) {
        step = 10; // Medium range: steps of 10
    } else {
        step = 20; // Large range: steps of 20
    }
    
    const tickValues = [];
    for (let val = minVal; val <= maxVal; val += step) {
        tickValues.push(Math.round(val));
    }
    // Always include the max value
    if (tickValues[tickValues.length - 1] < maxVal) {
        tickValues.push(Math.round(maxVal));
    }
    
    // Remove duplicates
    const uniqueTicks = [...new Set(tickValues)];
    
    // Clean axis with specific ticks to prevent clutter
    const legendAxis = d3.axisBottom(legendScale)
        .tickValues(uniqueTicks) // Use specific tick values
        .tickFormat(d => {
            if (d >= 80) return '80+';
            return d.toFixed(0);
        })
        .tickSize(5);
    
    const axisG = legend.append('g')
        .attr('transform', `translate(0, ${legendHeight})`)
        .style('font-size', '11px')
        .style('font-family', 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif')
        .style('fill', '#2c3e50');
    
    axisG.call(legendAxis);
    
    // Ensure labels are clean and properly formatted
    axisG.selectAll('.tick text')
        .style('font-size', '11px')
        .style('font-weight', '500')
        .attr('dy', '0.5em')
        .style('text-anchor', 'middle');
}

function updateChoroplethMap(year) {
    if (!mapSvg || mapSvg.empty()) {
        initChoroplethMap();
        return;
    }
    
    if (!globalState2.worldMap || !globalState2.worldMap.features) {
        // Reload world map if not available
        loadWorldMap2().then(worldData => {
            if (worldData && worldData.features) {
                globalState2.worldMap = worldData;
                fitProjection(worldData);
                renderChoropleth(worldData, year);
            } else {
                console.warn('World map not available for rendering');
            }
        });
        return;
    }
    
    // World map is available, render it
    renderChoropleth(globalState2.worldMap, year);
}

function showMapTooltip(event, d) {
    const tooltip = d3.select('#tooltip');
    if (tooltip.empty()) {
        console.warn('Tooltip element not found');
        return;
    }
    
    // Format life expectancy
    const lifeExpText = (d.lifeExp !== null && d.lifeExp !== undefined) 
        ? `${d.lifeExp.toFixed(1)} years` 
        : 'N/A';
    
    // Format year
    const yearText = d.year || 'N/A';
    
    // Create tooltip content - dark background with white text (like the image)
    tooltip
        .style('left', (event.pageX + 10) + 'px')
        .style('top', (event.pageY - 10) + 'px')
        .style('display', 'block')
        .style('background', 'rgba(0, 0, 0, 0.9)')
        .style('color', 'white')
        .style('padding', '12px 16px')
        .style('border-radius', '8px')
        .style('box-shadow', '0 4px 12px rgba(0,0,0,0.5)')
        .html(`
            <strong style="display: block; margin-bottom: 8px; font-size: 16px; color: white;">${d.country}</strong>
            <div style="margin: 4px 0; font-size: 13px;">
                <span style="color: #ccc;">Life Expectancy: </span>
                <span style="color: white; font-weight: 500;">${lifeExpText}</span>
            </div>
            <div style="margin: 4px 0; font-size: 13px;">
                <span style="color: #ccc;">Year: </span>
                <span style="color: white; font-weight: 500;">${yearText}</span>
            </div>
        `)
        .classed('visible', true);
}

function hideTooltip() {
    const tooltip = d3.select('#tooltip');
    if (!tooltip.empty()) {
        tooltip
            .style('display', 'none')
            .classed('visible', false);
    }
}

// Export functions
export { initChoroplethMap, updateChoroplethMap };
