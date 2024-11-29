// Farveskala
var colorScale = d3.scaleLog()
    .domain([1, 10, 250, 1000, 10000, 400000]) // Intervaller for dataset 2
    .range(["#808080", "#F8FCFF", "#B2D5E7", "#71B1D9", "#538DC5", "#3E5A89"]);


// The svg
var svg = d3.select("#my_dataviz"),
    width = +svg.attr("width"),
    height = +svg.attr("height");

// Opret SVG til infoboks til world map
var infoBoksSvg = d3.select("#world-map")
    .append("svg")
    .attr("id", "infoBoks")
    .attr("width", 200)
    .attr("height", 300);

// infoboks data
var infoBoksData = [
    { color: "#808080", text: "No data" },     // Grå for lande uden data
    { color: "#F8FCFF", text: "0 - 10 Tons" },      // Lys blå
    { color: "#B2D5E7", text: "10 - 250 Tons" },    // Blågrøn
    { color: "#71B1D9", text: "250 - 1.000 Tons" }, // Medium blå
    { color: "#538DC5", text: "1.000 - 10.000 Tons" }, // Dyb blå
    { color: "#3E5A89", text: "10.000 - 400.000 Tons" } // Mørk blå
];

// Tilføj farvebokse
infoBoksData.forEach(function(d, i) {
infoBoksSvg.append("rect")
    .attr("x", 0)
    .attr("y", 20 + i * 30)
    .attr("width", 20)
    .attr("height", 20)
    .attr("fill", d.color)
    .attr("stroke", "black");

// Teksten, som står til højre for farven
infoBoksSvg.append("text")
    .attr("x", 30)
    .attr("y", 35 + i * 30)
    .text(d.text)
    .style("font-size", "14px")
    .style("font-family", "Arial, sans-serif")
    .attr("alignment-baseline", "middle") /* Sørger for, at teksten er centreret med boksen */
    .attr("fill", "#ffffff");
});

// Map and projection
var projection = d3.geoNaturalEarth1()
    .scale(width / 1.8 / Math.PI) // Reducerer skalaen en smule
    .translate([width / 2, height / 1.8]); // Justerer fokuspunktet for bedre centreret visning

// Funktion til at give mig data hvis vi har data og ellers give mig Data mangler
function waste(countrydata) {
    if (countrydata.length === 0) 
        return "Data mangler";
    else 
        return countrydata[0].total_plastic_waste_mt;
}

// Funktion til at hente farve baseret på landets plastikdata
function getCountryColor(countryId) {
    return new Promise((resolve) => {
        d3.json("/api/totalwaste?countryId=" + countryId)
            .then(function(countrydata) {
                if (countrydata.length === 0) {
                    resolve("grey"); // Standardfarve for lande uden data
                } else {
                    var plasticAmount = +countrydata[0].total_plastic_waste_mt;
                    resolve(colorScale(plasticAmount)); // Returner farven for lande med data
                }
            })
            .catch(function(error) {
                console.error("Error fetching country data:", error);
                resolve("grey");
            });
    });
}

// Load external data and boot
d3.json("https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson")
    .then(function(data) {
        // Draw the map
        svg.append("g")
            .selectAll("path")
            .data(data.features)
            .enter().append("path")
                .attr("d", d3.geoPath().projection(projection))
                .style("stroke", "#fff")
                .each(function(d) {
                    // Hent farve til hvert land og opdater
                    getCountryColor(d.id).then(color => {
                        d3.select(this).attr("fill", color || "#ccc"); // Default farve, hvis der mangler data
                    });
                })
                .on("click", function(event, d) {
                    d3.json("/api/totalwaste?countryId=" + d.id)
                        .then(function(countrydata) {
                            console.log(countrydata);
                        });
                })
                .on("mouseover", function(event, d) { 
                    // Fjern dæmpning fra det aktuelle land
                    d3.select(this).classed("highlight", true);

                    // Tilføj dæmpning til alle andre lande
                    d3.selectAll("path").classed("dim", true);
                    d3.select(this).classed("dim", false);

                    // Hent data for landet
                    d3.json("/api/totalwaste?countryId=" + d.id)
                        .then(function(countrydata) {
                            d3.select(".tooltip").remove();

                            // Tilføjer en simpel pop-up (tooltip) med data fra API'en
                            d3.select("body").append("div")
                                .attr("class", "tooltip")
                                .style("position", "absolute")
                                .style("background", "#ffffff")
                                .style("color", "#000000")
                                .style("padding", "5px")
                                .style("border", "1px solid #ccc")
                                .style("border-radius", "5px")
                                .style("pointer-events", "none")
                                .style("top", (event.pageY - 20) + "px")
                                .style("left", (event.pageX + 20) + "px")
                                .html(`
                                    <strong>Country:</strong> ${d.properties.name || "Ukendt land"}<br>
                                    <strong>Waste per capita in kg:</strong> ${waste(countrydata)}
                                `);
                        });
                })
                .on("mouseout", function() {
                    // Fjern highlight fra alle lande
                    d3.selectAll("path").classed("highlight", false).classed("dim", false);

                    // Fjern tooltip
                    d3.select(".tooltip").remove();
                });
    })
    .catch(function(error) {
        console.error("Error loading GeoJSON data:", error);
    });