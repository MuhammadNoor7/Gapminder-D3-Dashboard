import { globalState2, getDataForYear, getContinentFromCountry, getContinentColor, formatPopulation } from './utils.js';

let motionSvg, xScale, yScale, rScale, xAxis, yAxis;
const margin = { top: 40, right: 40, bottom: 80, left: 80 };
let width, height;

function initMotionChart() {
    d3.select('#motion-chart').selectAll('svg').remove();
    
    const container = d3.select('#motion-chart');
    width = container.node().getBoundingClientRect().width - margin.left - margin.right;
    height = 500 - margin.top - margin.bottom;
    
    motionSvg = container.append('svg')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom);
    
    const g = motionSvg.append('g')
        .attr('transform', `translate(${margin.left},${margin.top})`);
    
    // Initialize scales
    xScale = d3.scaleLog()
        .domain([100, 100000])
        .range([0, width])
        .nice();
    
    yScale = d3.scaleLinear()
        .domain([0, 90])
        .range([height, 0])
        .nice();
    
    rScale = d3.scaleSqrt()
        .domain([0, 1500000000])
        .range([3, 40]);
    
    // Create axes
    xAxis = g.append('g')
        .attr('class', 'axis')
        .attr('transform', `translate(0,${height})`)
        .call(d3.axisBottom(xScale).tickFormat(d3.format('$,.0f')));
    
    yAxis = g.append('g')
        .attr('class', 'axis')
        .call(d3.axisLeft(yScale));
    
    // Add axis labels
    g.append('text')
        .attr('class', 'axis-label')
        .attr('transform', `translate(${width / 2}, ${height + 60})`)
        .style('text-anchor', 'middle')
        .text('GDP per Capita (USD)');
    
    g.append('text')
        .attr('class', 'axis-label')
        .attr('transform', 'rotate(-90)')
        .attr('y', -50)
        .attr('x', -height / 2)
        .style('text-anchor', 'middle')
        .text('Life Expectancy (years)');
}

function updateMotionChart(year) {
    if (!motionSvg || motionSvg.empty()) {
        initMotionChart();
    }
    
    const data = getDataForYear(year);
    if (!data || data.length === 0) {
        console.warn(`No data for year ${year}`);
        return;
    }
    
    // Filter data based on selected continent
    let filteredData = data;
    if (globalState2.selectedContinent) {
        filteredData = data.filter(d => {
            const continent = d.continent || getContinentFromCountry(d.country);
            return continent === globalState2.selectedContinent;
        });
    }
    
    // Update scales based on data
    const gdpExtent = d3.extent(data, d => d.gdp).filter(d => d > 0);
    const lifeExtent = d3.extent(data, d => d.lifeExp).filter(d => d > 0);
    const popExtent = d3.extent(data, d => d.pop).filter(d => d > 0);
    
    if (gdpExtent[0] && gdpExtent[1]) {
        xScale.domain([Math.max(100, gdpExtent[0] * 0.8), Math.min(100000, gdpExtent[1] * 1.2)]);
    }
    if (lifeExtent[0] && lifeExtent[1]) {
        yScale.domain([Math.max(0, lifeExtent[0] - 5), Math.min(90, lifeExtent[1] + 5)]);
    }
    if (popExtent[0] && popExtent[1]) {
        rScale.domain([0, popExtent[1] * 1.1]);
    }
    
    const g = motionSvg.select('g');
    
    // Update axes with transition
    const transition = globalState2.isPlaying ? 
        d3.transition().duration(500).ease(d3.easeCubicInOut) : 
        d3.transition().duration(0);
    
    xAxis.transition(transition).call(d3.axisBottom(xScale).tickFormat(d3.format('$,.0f')));
    yAxis.transition(transition).call(d3.axisLeft(yScale));
    
    // General Update Pattern for circles
    const circles = g.selectAll('.country-bubble')
        .data(filteredData, d => d.country);
    
    // Exit
    circles.exit()
        .transition(transition)
        .attr('r', 0)
        .attr('opacity', 0)
        .remove();
    
    // Enter
    const enter = circles.enter()
        .append('circle')
        .attr('class', 'country-bubble')
        .attr('r', 0)
        .attr('opacity', 0)
        .attr('fill', d => {
            const continent = d.continent || getContinentFromCountry(d.country);
            return getContinentColor(continent);
        })
        .on('mouseover', function(event, d) {
            d3.select(this).attr('stroke-width', 3);
            showTooltip(event, d);
        })
        .on('mouseout', function() {
            d3.select(this).attr('stroke-width', 2);
            hideTooltip();
        });
    
    // Update (merge enter + update) with proper interpolation
    circles.merge(enter)
        .transition(transition)
        .attrTween('cx', function(d) {
            const currentX = d3.select(this).attr('cx') || xScale(d.gdp);
            const targetX = xScale(d.gdp);
            return d3.interpolateNumber(+currentX, targetX);
        })
        .attrTween('cy', function(d) {
            const currentY = d3.select(this).attr('cy') || yScale(d.lifeExp);
            const targetY = yScale(d.lifeExp);
            return d3.interpolateNumber(+currentY, targetY);
        })
        .attrTween('r', function(d) {
            const currentR = d3.select(this).attr('r') || 0;
            const targetR = rScale(d.pop);
            return d3.interpolateNumber(+currentR, targetR);
        })
        .attr('opacity', d => {
            if (globalState2.selectedContinent) {
                const continent = d.continent || getContinentFromCountry(d.country);
                return continent === globalState2.selectedContinent ? 0.7 : 0.2;
            }
            return 0.7;
        });
    
    // Update labels for top countries by population
    const topCountries = filteredData
        .sort((a, b) => b.pop - a.pop)
        .slice(0, 10);
    
    const labels = g.selectAll('.country-label')
        .data(topCountries, d => d.country);
    
    labels.exit()
        .transition(transition)
        .attr('opacity', 0)
        .remove();
    
    const enterLabels = labels.enter()
        .append('text')
        .attr('class', 'country-label')
        .attr('opacity', 0);
    
    labels.merge(enterLabels)
        .transition(transition)
        .attrTween('x', function(d) {
            const currentX = d3.select(this).attr('x') || xScale(d.gdp);
            const targetX = xScale(d.gdp);
            return d3.interpolateNumber(+currentX, targetX);
        })
        .attrTween('y', function(d) {
            const currentY = d3.select(this).attr('y') || (yScale(d.lifeExp) - rScale(d.pop) - 5);
            const targetY = yScale(d.lifeExp) - rScale(d.pop) - 5;
            return d3.interpolateNumber(+currentY, targetY);
        })
        .text(d => d.country.length > 15 ? d.country.substring(0, 12) + '...' : d.country)
        .attr('opacity', 0.8);
}

function showTooltip(event, d) {
    const tooltip = d3.select('#tooltip');
    tooltip
        .style('left', (event.pageX + 10) + 'px')
        .style('top', (event.pageY - 10) + 'px')
        .html(`
            <strong>${d.country}</strong>
            GDP: $${d.gdp.toLocaleString('en-US', {maximumFractionDigits: 0})}
            <br>Life Expectancy: ${d.lifeExp.toFixed(1)} years
            <br>Population: ${formatPopulation(d.pop)}
            <br>Year: ${d.year}
        `)
        .classed('visible', true);
}

function hideTooltip() {
    d3.select('#tooltip').classed('visible', false);
}

// Export functions
export { initMotionChart, updateMotionChart };

