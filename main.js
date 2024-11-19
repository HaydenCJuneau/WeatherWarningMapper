import "https://d3js.org/d3.v7.min.js";

// Chart Sizing
const margin = { top: 40, right: 60, bottom: 40, left: 60 };
const WIDTH = 1420 - margin.left - margin.right;
const HEIGHT = 600 - margin.top - margin.bottom;

// - - Attach Callbacks - -
function attachCallbacks(plot) {
    plot.selectAll(".car")
    .on('mouseover', (event, data) => {
        d3.select(event.target)
            .attr('class', 'point-selected')
            .attr("stroke", "black");

        d3.select('#tooltip')
            .transition().duration(200)
            .style('opacity', 1);
        
        const text = 
            `Name: ${data.o.name}<br>
            Year: ${data.o.year}<br>
            Cylinders: ${data.o.cylinders}<br>
            Displacement: ${data.o.displacement_cc}<br>
            Economy (MPG): ${data.o.economy_mpg}<br>
            Horse Power: ${data.o.power_hp}<br>
            (0-60) Sec: ${data.o.speed_sec}<br>
            Weight (lbs): ${data.o.weight_lb}`;

        d3.select('#tooltip')
            .html(text);
    })
    .on('mouseout', (event, _) => {
        d3.select(event.target)
            .attr('class', '')
            .attr("stroke", "none");
        
        d3.select('#tooltip')
            .transition().duration(200)
            .style('opacity', 0);
    })
    .on('mousemove', (event, _) => {
        d3.select('#tooltip')
            .style('left', `${event.pageX + 10}px`)
            .style('top', `${event.pageY + 10}px`);
    });
}

// - - Generate the Main Map - -
function drawMap(plot, mapData) {
    // Create Projection and Plot Borders
    const projection = d3.geoAlbersUsa()
        .fitSize([WIDTH, HEIGHT], mapData);
    
    const generator = d3.geoPath()
        .projection(projection);

    plot.selectAll("path")
        .data(mapData.features)
        .enter()
        .append("path")
        .attr("d", generator)
        .attr('stroke', '#333')
        .attr('fill', '#cce5df')
        .attr('stroke-width', 0.5);

    // Return the Projector
    return projection;
}

//  - - Chart Generator Functions - -
function plotWarnings(plot, data) {
    // Clear any Previously created plot
    plot.selectAll("g").remove();

    // Plot Locations
    data.forEach((warn, i) => {
        const group = plot.append("g")
            .attr("class", `${warn.WARNINGTYPE}-group`)
            .attr("data-id", `warning-${i}`);

        warn.POLYGON.forEach(poly => {
            group.append("polygon")
                .attr("points", poly.map(d => `${d[0]},${d[1]}`).join(" "))
                .attr("stroke", "black")
                .attr("stroke-width", 2);
        });
    });

    // attachCallbacks(plot);
}

// - - Data Methods - -
async function parseWarnings(projection) {
    const raw = await d3.csv("data/warn-2001-parsed.csv");

    const points = raw
    .map(d => {
        const parsedPoly = JSON.parse(d.POLYGON);

        // For each poly part, project its coordinate
        const projectedPoly = parsedPoly.map(part =>
            part.map(coords => projection(coords))
                .filter(coords => coords != null)
        );

        return {
            ...d,
            POLYGON: projectedPoly
        };
    });

    return points;
}


//  - - Main Execution - -
async function main() {
    // Clear and Rebuild the Entire Plot
    const plotId = "#chart-container";
    d3.select(plotId).selectAll("*").remove();

    const plot = d3.select(plotId)        
        .append("svg")
            .attr("width", WIDTH + margin.left + margin.right)
            .attr("height", HEIGHT + margin.top + margin.bottom)
        .append("g")
            .attr("transform", `translate(${margin.left}, ${margin.top})`);
        
    // Draw Map and Fetch Projector
    const geoPathUSAStates = await d3.json("data/usa-states.json");
    const projector = drawMap(plot, geoPathUSAStates);

    // Get Warning Data and Plot
    const warnings = await parseWarnings(projector);
    plotWarnings(
        plot,
        warnings.filter(d => d.WARNINGTYPE === "tornado")
    );

    // Selection Callbacks
    document.getElementById("warning-type").onchange = () => {
        const select = document.getElementById("warning-type");
        console.log("date range changed", select.value);
        plotWarnings(
            plot,
            warnings.filter(d => d.WARNINGTYPE === select.value)
        );
    };
}

main();
