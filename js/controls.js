import { globalState2 } from './utils.js';

let sliderHandle, sliderTrack, sliderWidth = 800;
const minYear = 1800;
const maxYear = 2100;

function initControls() {
    d3.select('#play-pause').on('click', togglePlayPause);
    d3.select('#reset-button').on('click', resetAnimation);
    createCustomSlider();
}

function createCustomSlider() {
    const container = d3.select('#custom-slider-container');
    container.selectAll('svg').remove();
    
    sliderWidth = container.node().getBoundingClientRect().width || 800;
    const sliderHeight = 60;
    
    const sliderSvg = container.append('svg')
        .attr('width', sliderWidth)
        .attr('height', sliderHeight);
    
    // Create track
    const trackY = sliderHeight / 2;
    const trackPadding = 20;
    const trackWidth = sliderWidth - 2 * trackPadding;
    
    sliderTrack = sliderSvg.append('line')
        .attr('x1', trackPadding)
        .attr('y1', trackY)
        .attr('x2', trackPadding + trackWidth)
        .attr('y2', trackY)
        .attr('stroke', '#ccc')
        .attr('stroke-width', 4)
        .attr('stroke-linecap', 'round');
    
    // Create gradient for track
    const gradient = sliderSvg.append('defs')
        .append('linearGradient')
        .attr('id', 'sliderGradient')
        .attr('x1', '0%')
        .attr('x2', '100%');
    
    gradient.append('stop')
        .attr('offset', '0%')
        .attr('stop-color', '#667eea');
    
    gradient.append('stop')
        .attr('offset', '100%')
        .attr('stop-color', '#764ba2');
    
    // Create filled track
    const filledTrack = sliderSvg.append('line')
        .attr('x1', trackPadding)
        .attr('y1', trackY)
        .attr('x2', trackPadding)
        .attr('y2', trackY)
        .attr('stroke', 'url(#sliderGradient)')
        .attr('stroke-width', 4)
        .attr('stroke-linecap', 'round')
        .attr('class', 'filled-track');
    
    // Create handle
    sliderHandle = sliderSvg.append('circle')
        .attr('cx', trackPadding)
        .attr('cy', trackY)
        .attr('r', 15)
        .attr('fill', '#fff')
        .attr('stroke', '#667eea')
        .attr('stroke-width', 3)
        .style('cursor', 'grab')
        .style('filter', 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))');
    
    // Create drag behavior
    const drag = d3.drag()
        .on('start', function(event) {
            if (globalState2.isPlaying) {
                stopAnimation();
            }
            d3.select(this).style('cursor', 'grabbing');
        })
        .on('drag', function(event) {
            const x = Math.max(trackPadding, Math.min(trackPadding + trackWidth, event.x));
            const year = Math.round(
                minYear + ((x - trackPadding) / trackWidth) * (maxYear - minYear)
            );
            
            updateYear(year);
            updateSliderHandle(year);
            
            // Update filled track
            filledTrack.attr('x2', x);
        })
        .on('end', function() {
            d3.select(this).style('cursor', 'grab');
        });
    
    sliderHandle.call(drag);
    
    // Make track clickable
    sliderTrack.on('click', function(event) {
        if (globalState2.isPlaying) {
            stopAnimation();
        }
        
        const [x] = d3.pointer(event, this);
        const clampedX = Math.max(trackPadding, Math.min(trackPadding + trackWidth, x));
        const year = Math.round(
            minYear + ((clampedX - trackPadding) / trackWidth) * (maxYear - minYear)
        );
        
        updateYear(year);
        updateSliderHandle(year);
        
        // Update filled track
        filledTrack.attr('x2', clampedX);
    });
    
    // Sync with HTML5 slider (hidden)
    const html5Slider = d3.select('#year-slider');
    html5Slider.on('input', function() {
        const year = +this.value;
        updateYear(year);
        updateSliderHandle(year);
    });
    
    // Initialize position
    updateSliderHandle(globalState2.currentYear);
}

function updateSliderHandle(year) {
    if (!sliderHandle || sliderHandle.empty()) return;
    
    const trackPadding = 20;
    const trackWidth = sliderWidth - 2 * trackPadding;
    const x = trackPadding + ((year - minYear) / (maxYear - minYear)) * trackWidth;
    
    sliderHandle.attr('cx', x);
    
    // Update filled track
    const filledTrack = d3.select('.filled-track');
    if (!filledTrack.empty()) {
        filledTrack.attr('x2', x);
    }
    
    // Sync HTML5 slider
    d3.select('#year-slider').property('value', year);
}

function togglePlayPause() {
    if (globalState2.isPlaying) {
        stopAnimation();
    } else {
        startAnimation();
    }
}

function startAnimation() {
    globalState2.isPlaying = true;
    d3.select('#play-pause').text('⏸️ Pause');
    
    globalState2.timer = d3.interval(() => {
        if (globalState2.currentYear >= maxYear) {
            stopAnimation();
            return;
        }
        
        globalState2.currentYear++;
        updateYear(globalState2.currentYear);
        updateSliderHandle(globalState2.currentYear);
        
        // Update all visualizations
        if (typeof window.updateMotionChart === 'function') {
            window.updateMotionChart(globalState2.currentYear);
        }
        if (typeof window.updateChoroplethMap === 'function') {
            window.updateChoroplethMap(globalState2.currentYear);
        }
        if (typeof window.updateSunburst === 'function') {
            window.updateSunburst(globalState2.currentYear);
        }
    }, 150); // Update every 150ms for smooth animation
}

function stopAnimation() {
    globalState2.isPlaying = false;
    d3.select('#play-pause').text('▶️ Play');
    
    if (globalState2.timer) {
        globalState2.timer.stop();
        globalState2.timer = null;
    }
}

function resetAnimation() {
    stopAnimation();
    globalState2.currentYear = minYear;
    updateYear(minYear);
    updateSliderHandle(minYear);
    
    // Update all visualizations
    if (typeof window.updateMotionChart === 'function') {
        window.updateMotionChart(minYear);
    }
    if (typeof window.updateChoroplethMap === 'function') {
        window.updateChoroplethMap(minYear);
    }
    if (typeof window.updateSunburst === 'function') {
        window.updateSunburst(minYear);
    }
}

function updateYear(year) {
    globalState2.currentYear = year;
    d3.select('#current-year').text(year);
    d3.select('#header-year').text(year);
}

// Export functions
export { initControls, updateSliderHandle, startAnimation, stopAnimation, resetAnimation };

