import { globalState2, getDataForYear, getContinentFromCountry, getContinentColor, formatPopulation } from './utils.js';

let sunburstSvg, partition, arc, radius, currentRoot;
const margin = { top: 20, right: 20, bottom: 20, left: 20 };

function initSunburst() {
    let container = d3.select('#sunburst-chart-container');
    if (container.empty()) {
        container = d3.select('#hierarchy');
    }
    if (container.empty()) {
        console.error('Sunburst container not found');
        return;
    }
    
    container.selectAll('svg').remove();
    container.selectAll('.continent-legend').remove();
    container.selectAll('.population-legend').remove();
    container.selectAll('.continent-population-display').remove();
    container.selectAll('.country-legend').remove();
    container.selectAll('.country-name-display').remove();
    
    // Ensure container has relative positioning and visibility
    container.style('position', 'relative')
        .style('min-height', '500px')
        .style('width', '100%');
    
    const containerWidth = Math.max(container.node().getBoundingClientRect().width || 800, 400);
    const containerHeight = 500;
    
    radius = Math.min(containerWidth - margin.left - margin.right, containerHeight - margin.top - margin.bottom - 60) / 2;
    
    sunburstSvg = container.append('svg')
        .attr('width', containerWidth)
        .attr('height', containerHeight)
        .style('display', 'block')
        .style('min-height', '500px')
        .style('background', 'transparent');
    
    const g = sunburstSvg.append('g')
        .attr('class', 'sunburst-group');
    
    partition = d3.partition()
        .size([2 * Math.PI, radius]);
    
    arc = d3.arc()
        .startAngle(d => d.x0)
        .endAngle(d => d.x1)
        .innerRadius(d => isNaN(d.y0) ? 0 : d.y0)
        .outerRadius(d => isNaN(d.y1) ? 0 : d.y1);
    
    // Add zoom behavior with scale 1-10 - simplified to prevent corner movement
    const zoom = d3.zoom()
        .scaleExtent([1, 10])
        .on('zoom', function(event) {
            const transform = event.transform;
            // Apply transform with center translation to keep sunburst centered
            g.attr('transform', 
                `translate(${containerWidth / 2 + transform.x}, ${containerHeight / 2 - 20 + transform.y}) scale(${transform.k})`
            );
        });
    
    sunburstSvg.call(zoom);
    
    // Set initial transform to center the sunburst
    const initialTransform = d3.zoomIdentity
        .translate(0, 0)
        .scale(1);
    sunburstSvg.call(zoom.transform, initialTransform);
    
    // Store zoom for later use
    sunburstSvg.zoom = zoom;
    
    // Store zoom for later use
    
    // Add continent population display (centered in sunburst)
    const continentPopulationDisplay = sunburstSvg.append('g')
        .attr('class', 'continent-population-display')
        .attr('transform', `translate(${containerWidth / 2}, ${containerHeight / 2 - 20})`)
        .style('pointer-events', 'none')
        .style('opacity', 0);
    
    // Add continent legend at the bottom - matching provided styling
    const continentLegend = container.append('div')
        .attr('class', 'continent-legend')
        .style('position', 'absolute')
        .style('bottom', '10px')
        .style('left', '50%')
        .style('transform', 'translateX(-50%)')
        .style('display', 'flex')
        .style('gap', '10px')
        .style('z-index', '10');
    
    // Add country legend (for individual countries - shown on continent hover)
    const countryLegend = container.append('div')
        .attr('class', 'country-legend')
        .style('position', 'absolute')
        .style('top', '10px')
        .style('right', '10px')
        .style('background', 'rgba(255, 255, 255, 0.95)')
        .style('padding', '12px 15px')
        .style('border-radius', '8px')
        .style('box-shadow', '0 4px 12px rgba(0,0,0,0.15)')
        .style('z-index', '10')
        .style('font-size', '11px')
        .style('font-family', 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif')
        .style('max-width', '250px')
        .style('max-height', '400px')
        .style('overflow-y', 'auto')
        .style('display', 'none');
    
    // Add country name display (shown on country hover)
    const countryNameDisplay = container.append('div')
        .attr('class', 'country-name-display')
        .style('position', 'absolute')
        .style('top', '10px')
        .style('right', '10px')
        .style('background', 'rgba(255, 255, 255, 0.95)')
        .style('padding', '12px 15px')
        .style('border-radius', '8px')
        .style('box-shadow', '0 4px 12px rgba(0,0,0,0.15)')
        .style('z-index', '10')
        .style('font-size', '13px')
        .style('font-family', 'Segoe UI, Tahoma, Geneva, Verdana, sans-serif')
        .style('font-weight', '600')
        .style('display', 'none');
    
    // Add continent legend items - simplified styling
    const continents = ['Americas', 'Asia', 'Europe', 'Africa', 'Oceania'];
    continents.forEach(continent => {
        const legendItem = continentLegend.append('div')
            .style('display', 'flex')
            .style('align-items', 'center')
            .style('gap', '6px');
        
        legendItem.append('div')
            .style('width', '12px')
            .style('height', '12px')
            .style('background', getContinentColor(continent))
            .style('border-radius', '2px');
        
        legendItem.append('span')
            .text(continent)
            .style('color', '#333')
            .style('font-size', '11px')
            .style('font-family', 'Arial, sans-serif');
    });
    
    // Add population legend that follows cursor - matching provided styling
    const populationLegend = container.append('div')
        .attr('class', 'population-legend')
        .style('position', 'absolute')
        .style('background', '#000')
        .style('color', '#fff')
        .style('padding', '5px 10px')
        .style('border-radius', '5px')
        .style('box-shadow', '0 4px 8px rgba(0, 0, 0, 0.2)')
        .style('font-size', '12px')
        .style('font-family', 'Arial, sans-serif')
        .style('font-weight', 'bold')
        .style('pointer-events', 'none')
        .style('visibility', 'hidden')
        .style('z-index', '1000');
    
    if (globalState2.data) {
        updateSunburst(globalState2.currentYear);
    } else {
        // Wait for data to load
        setTimeout(() => {
            if (globalState2.data) {
                updateSunburst(globalState2.currentYear);
            }
        }, 1000);
    }
}

function updateSunburst(year) {
    if (!globalState2.data || globalState2.data.length === 0) return;
    
    if (!sunburstSvg || sunburstSvg.empty()) {
        initSunburst();
        if (!sunburstSvg || sunburstSvg.empty()) return;
    }
    
    const yearData = getDataForYear(year, false); // Sunburst can work with partial data (just needs pop)
    if (!yearData || yearData.length === 0) {
        const g = sunburstSvg.select('.sunburst-group');
        if (!g.empty()) {
            g.selectAll('*').remove();
        }
        return;
    }
    
    // Build hierarchy: World -> Continent -> Country
    // Filter to only include countries with valid population data
    const validYearData = yearData.filter(d => d.pop !== null && d.pop > 0);
    
    if (validYearData.length === 0) {
        const g = sunburstSvg.select('.sunburst-group');
        if (!g.empty()) {
            g.selectAll('*').remove();
        }
        return;
    }
    
    const hierarchyData = { name: 'World', children: [] };
    const continentMap = new Map();
    
    // Group countries by continent
    validYearData.forEach(d => {
        // Ensure continent is correctly determined and normalized
        // Always use getContinentFromCountry to ensure correct mapping
        let continent = getContinentFromCountry(d.country);
        // Also check if data already has continent (for consistency)
        if (!continent || continent === 'Unknown') {
            continent = d.continent || 'Unknown';
        }
        // Normalize continent name to match color map exactly
        continent = String(continent).trim();
        
        // Ensure continent name matches one of the valid continents (exclude Unknown)
        const validContinents = ['Americas', 'Asia', 'Europe', 'Africa', 'Oceania'];
        if (!validContinents.includes(continent)) {
            // Try to find a match (case-insensitive)
            const match = validContinents.find(c => c.toLowerCase() === continent.toLowerCase());
            if (match) {
                continent = match;
            } else {
                // If still unknown, try one more time with getContinentFromCountry
                const retryContinent = getContinentFromCountry(d.country);
                continent = validContinents.includes(retryContinent) ? retryContinent : 'Europe'; // Default to Europe for unmapped countries
            }
        }
        
        // Debug: Log if country is not mapped correctly
        if (d.country) {
            const lowerCountry = d.country.toLowerCase();
            // Check Oceania countries
            if ((lowerCountry.includes('papua') || lowerCountry.includes('australia') || 
                 lowerCountry.includes('new zealand') || lowerCountry.includes('fiji') ||
                 lowerCountry.includes('samoa') || lowerCountry.includes('tonga') ||
                 lowerCountry.includes('micronesia') || lowerCountry.includes('marshall') ||
                 lowerCountry.includes('palau') || lowerCountry.includes('nauru') ||
                 lowerCountry.includes('kiribati') || lowerCountry.includes('vanuatu') ||
                 lowerCountry.includes('solomon') || lowerCountry.includes('tuvalu')) &&
                continent !== 'Oceania') {
                console.warn(`Oceania country ${d.country} mapped to ${continent} instead of Oceania`);
                continent = 'Oceania'; // Force correct mapping
            }
            // Check Asian countries
            if ((lowerCountry.includes('china') || lowerCountry.includes('india') || lowerCountry.includes('japan')) &&
                continent !== 'Asia') {
                console.warn(`Country ${d.country} mapped to ${continent} instead of Asia`);
            }
        }
        
        if (!continentMap.has(continent)) {
            continentMap.set(continent, {
                name: continent,
                children: [],
                value: 0
            });
        }
        
        const continentNode = continentMap.get(continent);
        
        // Check if country already exists in this continent (avoid duplicates)
        const existingCountry = continentNode.children.find(c => c.name === d.country);
        if (existingCountry) {
            // If country already exists, update its value (in case of duplicate entries)
            existingCountry.value = Math.max(existingCountry.value, d.pop || 0);
        } else {
            // Add new country
            continentNode.children.push({
                name: d.country,
                value: d.pop || 0,
                continent: continent,
                country: d.country
            });
        }
    });
    
    // Calculate continent totals after all countries are added
    continentMap.forEach((continentNode) => {
        continentNode.value = d3.sum(continentNode.children, c => c.value);
    });
    
    // Convert map to array - use fixed order for even distribution around circle
    // This prevents cluttering and ensures all continents are visible
    // Exclude Unknown category
    const continentOrder = ['Americas', 'Asia', 'Europe', 'Africa', 'Oceania'];
    hierarchyData.children = Array.from(continentMap.values())
        .sort((a, b) => {
            const aIndex = continentOrder.indexOf(a.name);
            const bIndex = continentOrder.indexOf(b.name);
            // If both are in the order, sort by order
            if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
            // If only one is in order, prioritize it
            if (aIndex !== -1) return -1;
            if (bIndex !== -1) return 1;
            // If neither, sort by value
            return b.value - a.value;
        });
    hierarchyData.value = d3.sum(hierarchyData.children, d => d.value);
    
    // Sort countries within each continent by population
    hierarchyData.children.forEach(continent => {
        continent.children.sort((a, b) => b.value - a.value);
    });
    
    // Create hierarchy using d3.hierarchy (Requirement 2.3)
    // Don't sort continents - let partition distribute them evenly around the circle
    const root = d3.hierarchy(hierarchyData)
        .sum(d => d.value)
        .sort((a, b) => {
            // Only sort countries within continents by value
            // Don't sort continents themselves - let them be distributed evenly
            if (a.depth === 1 && b.depth === 1) {
                return 0; // Don't sort continents - keep original order for even distribution
            }
            // Sort countries within continents by value
            return b.value - a.value;
        });
    
    // Store root for zoom info
    currentRoot = root;
    sunburstSvg.currentRoot = root;
    
    // Partition - this will automatically distribute segments evenly
    partition(root);
    
    const g = sunburstSvg.select('.sunburst-group');
    if (g.empty()) {
        const containerWidth = sunburstSvg.node().getBoundingClientRect().width;
        const containerHeight = 500;
        g = sunburstSvg.append('g')
            .attr('class', 'sunburst-group')
            .attr('transform', `translate(${containerWidth / 2}, ${containerHeight / 2})`);
    }
    
    g.selectAll('path').remove();
    g.selectAll('text').remove();
    
    // Draw arcs with proper colors - using getContinentColor to match legend
    const paths = g.selectAll('path')
        .data(root.descendants())
        .join('path')
        .attr('d', arc)
        .attr('fill', d => {
            if (d.depth === 0) return '#95a5a6';
            if (d.depth === 1) {
                // Continent level - use getContinentColor to match legend
                const continentName = String(d.data.name).trim();
                return getContinentColor(continentName);
            }
            // Country level - use parent continent color (brighter shade)
            const continent = d.data.continent || (d.parent && d.parent.data ? String(d.parent.data.name).trim() : 'Unknown');
            const baseColor = d3.color(getContinentColor(continent));
            return baseColor ? baseColor.brighter(0.6) : '#95a5a6';
        })
        .attr('stroke', '#fff')
        .attr('stroke-width', d => d.depth === 1 ? 2 : 1)
        .style('cursor', 'pointer')
        .style('opacity', 0.9)
        .on('mouseover', function(event, d) {
            d3.select(this)
                .style('opacity', 1)
                .attr('stroke-width', d.depth === 1 ? 4 : 3)
                .attr('stroke', '#333');
            
            // Requirement 2.3: Filter motion chart by continent on hover
            if (d.depth === 1) {
                // Continent level - filter scatter plot
                globalState2.selectedContinent = d.data.name;
                if (typeof window.updateMotionChart === 'function') {
                    window.updateMotionChart(globalState2.currentYear);
                } else if (typeof updateMotionChart === 'function') {
                    updateMotionChart(globalState2.currentYear);
                }
                
                // Show continent population in center
                showContinentPopulation(d.data.name, d.value || 0);
                
                // Show country legend for this continent
                showCountryLegend(d);
            }
            
            // Show population legend that follows cursor and country name on right side
            if (d.depth === 2) { // Only show for country-level nodes
                const population = d.value || 0;
                const percentage = d.parent ? ((d.value / d.parent.value) * 100).toFixed(1) : '100';
                showPopulationLegend(event, d.data.name, population, percentage, year);
                // Also show country name and population on right side
                const continent = d.data.continent || (d.parent && d.parent.data ? d.parent.data.name : 'Unknown');
                showCountryName(d.data.name, continent, population, percentage);
            }
        })
        .on('mousemove', function(event, d) {
            // Update population legend position
            if (d.depth === 2) {
                const population = d.value || 0;
                const percentage = d.parent ? ((d.value / d.parent.value) * 100).toFixed(1) : '100';
                showPopulationLegend(event, d.data.name, population, percentage, year);
            }
        })
        .on('mouseout', function(event, d) {
            d3.select(this)
                .style('opacity', 0.9)
                .attr('stroke-width', d.depth === 1 ? 2.5 : 1.5)
                .attr('stroke', '#fff');
            
            // Requirement 2.3: Reset motion chart filter
            if (d.depth === 1) {
                globalState2.selectedContinent = null;
                if (typeof window.updateMotionChart === 'function') {
                    window.updateMotionChart(globalState2.currentYear);
                } else if (typeof updateMotionChart === 'function') {
                    updateMotionChart(globalState2.currentYear);
                }
                
                // Hide continent population display
                hideContinentPopulation();
                
                // Hide country legend
                hideCountryLegend();
            }
            
            hidePopulationLegend();
            // Hide country name display
            if (d.depth === 2) {
                hideCountryName();
            }
        })
        .on('click', function(event, d) {
            // Disable click-to-zoom to prevent corner movement
            // Users can use mouse wheel or pinch to zoom instead
            event.stopPropagation();
        });
    
    // Add labels - only show continents and top 1 country per continent to reduce clutter
    // Rest of countries are shown in the legend when hovering over the continent
    const labels = g.selectAll('text')
        .data(root.descendants().filter(d => {
            if (d.depth === 1) {
                // Always show continent labels
                return true;
            } else if (d.depth === 2) {
                // Only show top 1 country per continent to reduce clutter
                const continentNode = d.parent;
                if (!continentNode) return false;
                
                const siblings = continentNode.children || [];
                const sortedSiblings = [...siblings].sort((a, b) => (b.value || 0) - (a.value || 0));
                const topCountry = sortedSiblings[0]; // Only top 1 country
                
                // Also check if there's enough space for the label
                return (d.y1 - d.y0 > 10) && topCountry && topCountry.data.name === d.data.name;
            }
            return false;
        }))
        .join('text')
        .attr('transform', d => {
            const [x, y] = arc.centroid(d);
            return `translate(${x}, ${y + (d.depth === 1 ? -10 : 6)})`; // Adjust position based on depth
        })
        .text(d => {
            const name = d.data.name;
            if (d.depth === 1) {
                // Full continent names
                return name;
            } else {
                // Truncate country names if needed
                return name.length > 12 ? `${name.slice(0, 12)}...` : name;
            }
        })
        .attr('font-size', d => d.depth === 1 ? '9px' : d.depth === 2 ? '7px' : '9px')
        .attr('text-anchor', 'middle')
        .style('pointer-events', 'none') // Prevent text from interfering with mouse events
        .style('fill', '#333')
        .style('font-family', 'Arial, sans-serif');
}

function showPopulationLegend(event, name, population, percentage, year) {
    const container = d3.select('#sunburst-chart-container').empty() ? 
        d3.select('#hierarchy') : d3.select('#sunburst-chart-container');
    const populationLegend = container.select('.population-legend');
    
    if (populationLegend.empty()) return;
    
    populationLegend
        .style('left', (event.pageX + 15) + 'px')
        .style('top', (event.pageY - 15) + 'px')
        .style('visibility', 'visible')
        .html(`
            <div style='color: blue;'>Date: ${year}</div>
            <div style='color: blue;'>Population: ${formatPopulation(population)}</div>
        `);
}

function hidePopulationLegend() {
    const container = d3.select('#sunburst-chart-container').empty() ? 
        d3.select('#hierarchy') : d3.select('#sunburst-chart-container');
    const populationLegend = container.select('.population-legend');
    
    if (!populationLegend.empty()) {
        populationLegend.style('visibility', 'hidden');
    }
}

function showContinentPopulation(continentName, population) {
    const display = sunburstSvg.select('.continent-population-display');
    
    if (display.empty()) return;
    
    display.selectAll('*').remove();
    
    // Add background circle
    display.append('circle')
        .attr('r', 60)
        .attr('fill', 'rgba(255, 255, 255, 0.95)')
        .attr('stroke', getContinentColor(continentName))
        .attr('stroke-width', 3)
        .style('filter', 'drop-shadow(0 4px 8px rgba(0,0,0,0.2))');
    
    // Add continent name
    display.append('text')
        .attr('y', -10)
        .attr('text-anchor', 'middle')
        .attr('font-size', '18px')
        .attr('font-weight', 'bold')
        .attr('fill', getContinentColor(continentName))
        .text(continentName);
    
    // Add population
    display.append('text')
        .attr('y', 15)
        .attr('text-anchor', 'middle')
        .attr('font-size', '16px')
        .attr('font-weight', '600')
        .attr('fill', '#333')
        .text(formatPopulation(population));
    
    display.transition()
        .duration(200)
        .style('opacity', 1);
}

function hideContinentPopulation() {
    const display = sunburstSvg.select('.continent-population-display');
    if (!display.empty()) {
        display.transition()
            .duration(200)
            .style('opacity', 0);
    }
}

function showCountryLegend(continentNode) {
    const container = d3.select('#sunburst-chart-container').empty() ? 
        d3.select('#hierarchy') : d3.select('#sunburst-chart-container');
    const countryLegend = container.select('.country-legend');
    
    if (countryLegend.empty() || !continentNode.children) return;
    
    // Sort countries by population
    const countries = [...continentNode.children]
        .sort((a, b) => (b.value || 0) - (a.value || 0))
        .slice(0, 10); // Show top 10 in legend
    
    countryLegend.html('');
    
    // Add title
    countryLegend.append('div')
        .style('font-weight', 'bold')
        .style('font-size', '13px')
        .style('margin-bottom', '10px')
        .style('color', getContinentColor(continentNode.data.name))
        .style('border-bottom', `2px solid ${getContinentColor(continentNode.data.name)}`)
        .style('padding-bottom', '5px')
        .text(`${continentNode.data.name} - Top Countries`);
    
    // Add country list
    countries.forEach((country, index) => {
        const countryItem = countryLegend.append('div')
            .style('display', 'flex')
            .style('justify-content', 'space-between')
            .style('align-items', 'center')
            .style('padding', '6px 0')
            .style('border-bottom', index < countries.length - 1 ? '1px solid #e0e0e0' : 'none');
        
        countryItem.append('span')
            .style('font-weight', '500')
            .style('color', '#333')
            .text(country.data.name);
        
        countryItem.append('span')
            .style('font-weight', '600')
            .style('color', getContinentColor(continentNode.data.name))
            .text(formatPopulation(country.value || 0));
    });
    
    countryLegend.style('display', 'block');
}

function hideCountryLegend() {
    const container = d3.select('#sunburst-chart-container').empty() ? 
        d3.select('#hierarchy') : d3.select('#sunburst-chart-container');
    const countryLegend = container.select('.country-legend');
    
    if (!countryLegend.empty()) {
        countryLegend.style('display', 'none');
    }
}

function showCountryName(countryName, continentName, population, percentage) {
    const container = d3.select('#sunburst-chart-container').empty() ? 
        d3.select('#hierarchy') : d3.select('#sunburst-chart-container');
    const countryNameDisplay = container.select('.country-name-display');
    
    if (countryNameDisplay.empty()) return;
    
    countryNameDisplay
        .style('display', 'block')
        .html(`
            <div style="color: ${getContinentColor(continentName)}; font-weight: 700; font-size: 16px; margin-bottom: 8px;">
                ${countryName}
            </div>
            <div style="color: #666; font-size: 12px; font-weight: 500; margin-bottom: 6px;">
                ${continentName}
            </div>
            <div style="color: #333; font-size: 14px; font-weight: 600; margin-bottom: 4px;">
                👥 Population: ${formatPopulation(population)}
            </div>
            <div style="color: #666; font-size: 11px; font-weight: 500;">
                📊 ${percentage}% of ${continentName}
            </div>
        `);
}

function hideCountryName() {
    const container = d3.select('#sunburst-chart-container').empty() ? 
        d3.select('#hierarchy') : d3.select('#sunburst-chart-container');
    const countryNameDisplay = container.select('.country-name-display');
    
    if (!countryNameDisplay.empty()) {
        countryNameDisplay.style('display', 'none');
    }
}

// Export functions
export { initSunburst, updateSunburst };

