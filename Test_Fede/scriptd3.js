// Fjern tidligere infoboks
d3.select("#infoBoks").remove();

// Fjern tidligere kort (hvis det findes)
d3.select("#my_dataviz").selectAll("*").remove();

// Farveskala
var colorScale = d3.scaleLog()
    .domain([0.01, 5, 25, 45, 65, 85]) // Recycling Rate intervaller
    .range(["#eef9e0", "#C7E9C0", "#7FCDBB", "#41a891", "#317e6c", "#215448"]); // Farver til intervaller

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
    { color: "grey", text: "No data" },     // Grå for lande uden data
    { color: "#eef9e0", text: "0% - 5%" }, // Lys grøn
    { color: "#C7E9C0", text: "5% - 25%" }, // Grøn
    { color: "#7FCDBB", text: "25% - 45%" }, // Blågrøn
    { color: "#41a891", text: "45% - 65%" }, // Mellemblå
    { color: "#317e6c", text: "65% - 85%" }, // Dyb blå
    { color: "#215448", text: "85% - 100%" } // Mørk blå
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
        return "No data";
    else 
        return countrydata[0].recycling_rate + "%";
}

// Funktion til at hente farve baseret på landets plastikdata
function getCountryColor(countryId) {
    return new Promise((resolve) => {
        d3.json("/api/recycleinfo?countryId=" + countryId)
            .then(function(countrydata) {
                if (countrydata.length === 0) {
                    resolve("grey"); // Standardfarve for lande uden data
                } else {
                    var plasticAmount = +countrydata[0].recycling_rate;
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
                    d3.json("/api/recycleinfo?countryId=" + d.id)
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
                    d3.json("/api/recycleinfo?countryId=" + d.id)
                        .then(function(countrydata) {
                            d3.select(".tooltipmap").remove();

                            // Tilføjer en simpel pop-up (tooltip) med data fra API'en
                            d3.select("body").append("div")
                                .attr("class", "tooltipmap")
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
                                    <strong>Recycling rate:</strong> ${waste(countrydata)}
                                `);
                        });
                })
                .on("mouseout", function() {
                    // Fjern highlight fra alle lande
                    d3.selectAll("path").classed("highlight", false).classed("dim", false);

                    // Fjern tooltip
                    d3.select(".tooltipmap").remove();
                });
    })
    .catch(function(error) {
        console.error("Error loading GeoJSON data:", error);
    });
