import "https://d3js.org/d3.v7.min.js";

// Chart Sizing
const margin = { top: 40, right: 60, bottom: 40, left: 60 };
const WIDTH = 1420 - margin.left - margin.right;
const HEIGHT = 600 - margin.top - margin.bottom;
const RADIUS = 260;

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

//  - - Chart Generator Functions - -
async function generatePlot(plotId, outline) {
    // Reset Plot
    d3.select(plotId).selectAll("*").remove();

    // Create Plot Container
    const plot = d3.select(plotId)        
        .append("svg")
            .attr("width", WIDTH + margin.left + margin.right)
            .attr("height", HEIGHT + margin.top + margin.bottom)
        .append("g")
            .attr("transform", `translate(${margin.left}, ${margin.top})`);

    // Create Projection and Plot Borders
    const projection = d3.geoAlbersUsa()
        .fitSize([WIDTH, HEIGHT], outline);
    
    const generator = d3.geoPath()
        .projection(projection);

    plot.selectAll("path")
        .data(outline.features)
        .enter()
        .append("path")
        .attr("d", generator)
        .attr('stroke', '#333')
        .attr('fill', '#cce5df')
        .attr('stroke-width', 0.5);

    // Get Locations
    const warnings = await projectData(projection);

    // Plot Locations
    warnings.forEach((warn, i) => {
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
}

async function projectData(projection) {
    const raw = await d3.csv("data/warn-2001-parsed.csv");

    const points = raw
    .slice(1000, 2000)
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
    const geo_json = await d3.json("data/usa-states.json");

    await generatePlot("#chart-container", geo_json);
}

main();
