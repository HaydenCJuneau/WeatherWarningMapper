// Default States
let graphType = "heatmap";
let warningType = "severe-thunderstorm";
let monthSelected = "5";

// Chart Sizing (1420x600) is a good alterniative to window size
const margin = { top: 40, right: 60, bottom: 40, left: 60 };
const WIDTH = (window.innerWidth * .9) - margin.left - margin.right;
const HEIGHT = (window.innerHeight * .8) - margin.top - margin.bottom;

// - - Setup Options --
function initMonths() {
    const selector = document.getElementById("month-selector");
    let text = "";
    for (let i = 1; i <= 12; i++) {
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

function plotHex(plot, data, filter) {
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

    const maxLength = d3.max(hexData, d => d.length);

    const radius = d3.scaleSqrt()
        .domain([0, maxLength]) // defines scale for points per bin
        .range([5, maxRadius]); // defines radius based on position in scale

    const colorScale = 
        d3.scaleSequential(d3.interpolateOranges)
        .domain([0, maxLength]);

    const hexes = plot.append("g")
        .attr("class", "hexagon")
        .selectAll("path")
        .data(hexData)
        .enter();

    hexes.append("path")
        // .attr("d", d => hexbin.hexagon(radius(d.length)))
        .attr("d", d => hexbin.hexagon(maxRadius))
        .attr("transform", d => "translate(" + d.x + "," + d.y + ")")
        .attr("class", `${warningType}-hex`)
        .attr("fill", d => colorScale(d.length))
        .attr("stroke", "black");

    hexes.append("text")
        .attr("x", d => d.x)
        .attr("y", d => d.y)
        .attr("text-anchor", "middle")
        .attr("dy", "0.3em")
        .text(d => d.length)
        .attr("font-size", "12px")
        .attr("fill", "black");
}

// - - Data Methods - -
async function projectData(projection) {
    const raw = await d3.csv(`data/monthly/warn-month-${monthSelected}.csv`);

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
    initMonths();

    // Clear and Rebuild the Entire Plot
    const plotId = "#chart-container";
    d3.select(plotId).selectAll("*").remove();

    const plot = d3.select(plotId)        
        .append("svg")
            .attr("width", WIDTH + margin.left + margin.right)
            .attr("height", HEIGHT + margin.top + margin.bottom)
        .append("g")
            .attr("transform", `translate(${margin.left}, ${margin.top})`)
            .attr("class", "canvas");
        
    // Draw Map and Fetch Projector
    const geoPathUSAStates = await d3.json("data/usa-states.json");
    const projector = drawMap(plot, geoPathUSAStates);

    // Get Warning Data and Plot
    const plt = async () => {
        const warnings = await projectData(projector);
        
        if (graphType === "heatmap")
            plotHex(
                plot,
                warnings,
                (d) => d.WARNINGTYPE === warningType
            );
        else
            plotWarnings(
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
        const month = document.getElementById("month-selector").value;
        const graph = document.getElementById("graph-type").value;
        
        // Do not Process data if options havent changed
        if (warningType === warn && 
            monthSelected === month && 
            graphType === graph) 
            return;
        
        warningType = warn;
        monthSelected = month;
        graphType = graph;

        plt();
    };

    document.getElementById("warning-type").value = warningType;
    document.getElementById("month-selector").value = monthSelected;
    document.getElementById("graph-type").value = graphType;
}

main();
