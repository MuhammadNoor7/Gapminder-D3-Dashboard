import { globalState2, loadGapminderData, loadWorldMap2 } from './utils.js';
import { initMotionChart, updateMotionChart } from './motion_chart.js';
import { initChoroplethMap, updateChoroplethMap } from './choropleth_map.js';
import { initSunburst, updateSunburst } from './sunburst.js';
import { initControls, updateSliderHandle } from './controls.js';

// Make update functions globally available for controls
window.updateMotionChart = updateMotionChart;
window.updateChoroplethMap = updateChoroplethMap;
window.updateSunburst = updateSunburst;

document.addEventListener('DOMContentLoaded', function() {
    console.log('Initializing Dashboard 2...');
    
    // Initialize all components first (create SVG containers)
    initMotionChart();
    initChoroplethMap();
    initControls();
    initSunburst();
    
    // Load data and then update visualizations
    Promise.all([loadGapminderData(), loadWorldMap2()])
        .then(() => {
            console.log('Data loaded successfully');
            
            // Update header stats
            if (globalState2.data) {
                const uniqueCountries = new Set(globalState2.data.map(d => d.country));
                d3.select('#header-countries').text(uniqueCountries.size);
                
                // Find the first year with data if 1800 has none
                let initialYear = globalState2.currentYear;
                let dataForInitialYear = globalState2.data.filter(d => 
                    d.year === initialYear && 
                    d.gdp !== null && d.gdp > 0 && 
                    d.lifeExp !== null && d.lifeExp > 0 && 
                    d.pop !== null && d.pop > 0
                );
                
                if (dataForInitialYear.length === 0 && globalState2.data.length > 0) {
                    const yearsWithData = globalState2.data
                        .filter(d => 
                            d.gdp !== null && d.gdp > 0 && 
                            d.lifeExp !== null && d.lifeExp > 0 && 
                            d.pop !== null && d.pop > 0
                        )
                        .map(d => d.year)
                        .sort((a, b) => a - b);
                    
                    if (yearsWithData.length > 0) {
                        initialYear = yearsWithData[0];
                        globalState2.currentYear = initialYear;
                        d3.select('#current-year').text(initialYear);
                        d3.select('#header-year').text(initialYear);
                        
                        updateSliderHandle(initialYear);
                    }
                }
                
                // Small delay to ensure all components are ready
                setTimeout(() => {
                    console.log(`Updating visualizations for year ${initialYear}`);
                    
                    // Update all visualizations with initial data
                    updateMotionChart(initialYear);
                    updateChoroplethMap(initialYear);
                    updateSunburst(initialYear);
                    
                    console.log('Dashboard 2 initialized successfully');
                }, 300);
            } else {
                console.warn('No data available');
            }
        })
        .catch(error => {
            console.error('Error loading data:', error);
            
            // Still initialize components even if data fails
            setTimeout(() => {
                updateMotionChart(globalState2.currentYear);
                updateChoroplethMap(globalState2.currentYear);
                updateSunburst(globalState2.currentYear);
            }, 300);
        });
});

