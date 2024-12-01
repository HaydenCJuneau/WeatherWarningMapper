// import "https://d3js.org/d3.v7.min.js";

// Default States
let warningType = "tornado";
let yearSelected = "2001";

// Chart Sizing
const margin = { top: 40, right: 60, bottom: 40, left: 60 };
const WIDTH = 1420 - margin.left - margin.right;
const HEIGHT = 600 - margin.top - margin.bottom;

// - - Setup Options --
function initYears() {
    const selector = document.getElementById("year-selector");
    let text = "";
    for (let i = 2001; i <= 2016; i++) {
        text += `<option value=${i}>${i}</option>\n`;
    }

    selector.innerHTML = text;
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
function plotWarnings(plot, data, filter) {
    // Clear any Previously created plot
    plot.selectAll("g").remove();

    // Plot Locations
    data.filter(filter).forEach((warn, i) => {
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

function plotBins(plot, data, filter) {
    // Clear any Previously created plot
    plot.selectAll("g").remove();

    // Setup a Hexagonal Binning Map
    const maxRadius = 15;

    const hexbin = d3.hexbin()
        .extent([[0, 0], [WIDTH, HEIGHT]])
        .radius(maxRadius);

    const hexData = hexbin(
        data
        .filter(filter)
        .flatMap(d => d.MEAN || [])
    );

    const radius = d3.scaleSqrt()
        .domain([0, d3.max(hexData, d => d.length)]) // defines scale for points per bin
        .range([0, maxRadius]); // defines radius based on position in scale


    plot.append("g")
           .attr("class", "hexagon")
        .selectAll("path")
        .data(hexData)
        .enter()
        .append("path")
            .attr("d", d => hexbin.hexagon(radius(d.length)))
            .attr("transform", d => "translate(" + d.x + "," + d.y + ")")
            .attr("class", `${warningType}-hex`)
            .attr("stroke", "black");
}

// - - Data Methods - -
async function parseWarnings(projection) {
    const raw = await d3.csv(`data/warn-${yearSelected}-parsed.csv`);

    const points = raw
    .map(d => {
        const parsedPoly = JSON.parse(d.POLYGON);
        const parsedMean = JSON.parse(d.MEAN);

        // For each poly part, project its coordinate
        const projectedPoly = parsedPoly.map(part =>
            part.map(coords => projection(coords))
                .filter(coords => coords != null)
        );

        const projectedMean = parsedMean
            .map(part => projection(part))
            .filter(coords => coords != null);
    
        return {
            ...d,
            POLYGON: projectedPoly,
            MEAN: projectedMean
        };
    });

    return points;
}

//  - - Main Execution - -
async function main() {
    // Initialization
    initYears();

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
    const plt = async () => {
        const warnings = await parseWarnings(projector);
        
        plotBins(
            plot,
            warnings,
            (d) => d.WARNINGTYPE === warningType
        );
    };

    plt();

    // Selection Callbacks
    document.getElementById("selector-submit").onclick = () => {
        // Get the Warning Type and Year Selected
        const warn = document.getElementById("warning-type").value;
        const year = document.getElementById("year-selector").value;
        
        // Do not Process data if options havent changed
        if (warningType === warn && yearSelected === year) return;
        
        warningType = warn;
        yearSelected = year;

        plt();
    };

    document.getElementById("warning-type").value = warningType;
    document.getElementById("year-selector").value = yearSelected;
}

main();
